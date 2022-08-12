import { debounce } from '@material-ui/core';
import _ from 'lodash';
import { HandshakeResponse } from '../models/HandshakeBody';
import { clearCache } from '../providers/dataDonation.provider';
import { FIXED_USER_NAME } from './chrome/background/account';
import {
  partialLocalLookup,
  Response,
  serverLookup,
  settingsLookup,
} from './chrome/background/sendMessage';
import db from './chrome/db';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import { Hub } from './hub';
import log from './logger';
import HubEvent from './models/HubEvent';
import { ServerLookup } from './models/Message';
import UserSettings from './models/UserSettings';
import { bo } from './utils/browser.utils';

// instantiate a proper logger
const appLog = log.extend('app');

export interface BaseObserverHandler {
  color?: string;
  handle: (
    n: HTMLElement,
    opts: Omit<ObserverHandler, 'handle'>,
    selectorName: string,
    s: UserSettings
  ) => void;
}

export interface SelectorObserverHandler extends BaseObserverHandler {
  match: {
    type: 'selector';
    selector: string;
  };
}

export interface SelectorWithParentsObserverHandler
  extends BaseObserverHandler {
  match: {
    type: 'selector-with-parents';
    selector: string;
    parents: number;
  };
}

export interface RouteObserverHandler extends BaseObserverHandler {
  match: {
    type: 'route';
    location: RegExp;
  };
}

export type ObserverHandler =
  | SelectorObserverHandler
  | SelectorWithParentsObserverHandler
  | RouteObserverHandler;

interface SetupObserverOpts {
  platformMatch: RegExp;
  handlers: {
    [key: string]: ObserverHandler;
  };
  onLocationChange: (oldLocation: string, newLocation: string) => void;
}

export interface BootOpts {
  payload: ServerLookup['payload'];
  mapLocalConfig: (
    c: UserSettings,
    payload: ServerLookup['payload']
  ) => UserSettings;
  observe: SetupObserverOpts;
  hub: {
    hub: Hub<any>;
    onRegister: (h: Hub<HubEvent>, config: UserSettings) => void;
  };
  onAuthenticated: (res: any) => void;
}

/**
 * refresh the identifier for the next data collected
 */
export function refreshUUID(counter: number): string {
  appLog.info('refreshing feedId and cleaning size Cache');
  // mandatory clear the cache otherwise sizeCheck would fail
  clearCache();
  return counter + '—' + Math.random() + '-' + _.random(0, 0xff);
}

let oldHref: string;
/**
 * setup the mutation observer with
 * given callbacks for selectors
 */
function setupObserver(
  { handlers, platformMatch, onLocationChange }: SetupObserverOpts,
  config: UserSettings
): MutationObserver {
  const handlersList = Object.keys(handlers);
  // register selector and 'selector-with-parents' handlers
  handlersList.forEach((h) => {
    const { handle, ...handler } = handlers[h];

    if (
      handler.match.type === 'selector' ||
      handler.match.type === 'selector-with-parents'
    ) {
      dom.on(handler.match.selector, (node) =>
        handle(node, handler, h, {
          ...config,
          href: window.location.toString(),
        } as any)
      );
    }
  });

  // appLog.debug('handlers installed %O', handlers);

  /* and monitor href changes to randomize a new accessId */
  const body = window.document.querySelector('body');

  const observer = new MutationObserver(
    debounce((mutations) => {
      // appLog.debug('mutation (%s) %O', mutation.type, mutation.target);

      if (window?.document) {
        if (platformMatch.test(window.location.href)) {
          if (window.location.href !== oldHref) {
            const newHref = window.location.href;

            appLog.debug(
              `%s changed to %s, calling onLocationChange`,
              oldHref,
              newHref
            );

            onLocationChange(oldHref, newHref);

            // always call the route handler
            const routeHandlerKey = handlersList.find((h) => {
              const handler = handlers[h];

              if (handler.match.type === 'route') {
                appLog.debug(
                  'Matching route %O',
                  handler.match,
                  window.location.pathname
                );
                return window.location.pathname.match(handler.match.location);
              }
              return false;
            });

            if (routeHandlerKey) {
              appLog.debug('Route handler key %s', routeHandlerKey);
              const { handle, ...routeHandlerOpts } = handlers[
                routeHandlerKey
              ] as RouteObserverHandler;
              handle(window.document.body, routeHandlerOpts, routeHandlerKey, {
                ...config,
                href: window.location.toString(),
              } as any);
            }

            oldHref = newHref;
          }
        }
      }
    }, 500)
  );

  const observerConfig = {
    childList: true,
    subtree: true,
  };

  window.addEventListener('unload', () => {
    appLog.debug('Window unloading, disconnect the observer...');
    if (observer) {
      observer.disconnect();
    }
  });

  if (body) {
    observer.observe(body, observerConfig);
  } else {
    appLog.error('setupObserver: body not found');
  }

  return observer;
}

/* Boot the application by giving a callback that
 * will be invoked after the handshake with API server.
 **/

interface App {
  config: UserSettings;
  reload: (c: UserSettings) => void;
  destroy: () => void;
}

let config: any;

/**
 * Transform functions that send messages to background
 * to promises for better code flow.
 */

const jsonSettingsP = (): Promise<Response<UserSettings>> =>
  new Promise((resolve) => settingsLookup(resolve));

const partialLocalLookupP = (): Promise<Response<Partial<UserSettings>>> =>
  new Promise((resolve) => partialLocalLookup(resolve));

const serverHandshakeP = (
  p: ServerLookup['payload']
): Promise<Response<HandshakeResponse>> =>
  new Promise((resolve) => serverLookup(p, resolve));

export async function boot(opts: BootOpts): Promise<App> {
  appLog.info('booting with config', opts.payload);

  // connect to a port to listen for `config` changes dispatched from background
  const configUpdatePort = bo.runtime.connect({ name: 'ConfigUpdate' });

  // Register all common event handlers.
  // An event handler is a piece of code responsible for a specific task.
  // You can learn more in the [`./handlers`](./handlers/index.html) directory.
  registerHandlers(opts.hub.hub);

  // load settings from json file
  const jsonSettings = await jsonSettingsP();

  if (jsonSettings.type === 'Error') {
    appLog.error('Json settings error %O', jsonSettings.error);
    throw jsonSettings.error;
  }

  // `response` contains the user's public key, we save it global for the blinks
  appLog.info('retrieved locally stored user settings %O', jsonSettings);

  // Lookup the current user
  const localSettings = await partialLocalLookupP();
  if (localSettings.type === 'Error') {
    throw localSettings.error;
  }

  // merge settings taken from json with ones stored in db, giving the precedence to the latter
  const settings = { ...jsonSettings.result, ...localSettings.result };

  // save settings in db, so they're properly retrieved on the next bootstrap
  await db.set(FIXED_USER_NAME, settings);

  if (!settings.active) {
    appLog.info('extension disabled!');
    const context = {
      config: settings,
      reload: () => {},
      destroy: () => {
        opts.hub.hub.clear();
      },
    };
    return context;
  }

  // merge the json and db settings with per-extension defined payload
  config = opts.mapLocalConfig(settings, opts.payload);

  // ATTENTION
  // this is needed by guardoni to retrieve the current publicKey
  // TODO: we may want to remove it since guardoni is now responsible to provide a proper publicKey to the extension

  // eslint-disable-next-line
  console.log(JSON.stringify({ response: config }));

  appLog.info('Updated config %O', config);

  // register platform specific event handlers
  opts.hub.onRegister(opts.hub.hub, config);

  // emergency button should be used when a supported with
  // UX hack in place didn't see any UX change, so they
  // can report the problem and we can handle it.
  // initializeEmergencyButton();

  // because the URL has been for sure reloaded, be sure to also
  clearCache();

  // send the configuration to the server to register the extension
  const handshakeResponse = await serverHandshakeP(config);

  appLog.info('Server lookup cb %O', handshakeResponse);
  if (handshakeResponse.type === 'Error') {
    throw handshakeResponse.error;
  }

  // setup the dom mutation observer
  let observer = setupObserver(opts.observe, config);

  // invoke callback for successful authentication
  opts.onAuthenticated(handshakeResponse.result);

  // define the app context to return
  const context: App = {
    config,
    reload: (c) => {
      appLog.debug('Reloading app with config %O', c);
      observer.disconnect();
      opts.hub.hub.dispatch('Sync');
      opts.hub.hub.clear();
      opts.hub.onRegister(opts.hub.hub, c);
      observer = undefined as any;
      observer = setupObserver(opts.observe, c);
    },
    destroy: () => {
      opts.hub.hub.clear();
      observer.disconnect();
    },
  };

  // listen on "ConfigUpdate" port for messages
  configUpdatePort.onMessage.addListener(function (message, sender) {
    appLog.debug('Received message on "ConfigUpdate" port %O', message);
    if (message.type === 'Reload') {
      context.reload(message.payload);
    }
  });

  return context;
}
