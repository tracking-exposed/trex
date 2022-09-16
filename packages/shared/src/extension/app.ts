import _ from 'lodash';
import { ParserConfiguration, ParserFn } from '../providers/parser.provider';
import { HandshakeResponse } from '../models/HandshakeBody';
import { clearCache } from '../providers/dataDonation.provider';
import { FIXED_USER_NAME, initializeKey } from './background/account';
import {
  partialLocalLookup,
  Response,
  serverLookup,
  settingsLookup,
} from './background/sendMessage';
import db from './db';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import { Hub } from './hub';
import log from './logger';
import HubEvent from './models/HubEvent';
import { ServerLookup } from './models/Message';
import UserSettings from './models/UserSettings';
import { renderUI, RenderUIProps } from './ui';
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

export interface BootOpts<
  S = any,
  M = any,
  C extends ParserConfiguration = ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>> = any
> {
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
  ui?: Omit<RenderUIProps<S, M, C, PP>, 'hub'>;
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
    _.debounce(
      (mutations) => {
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
              oldHref = newHref;
            }

            // always call the route handler
            const routeHandlerKey = handlersList.find((h) => {
              const handler = handlers[h];

              if (handler.match.type === 'route') {
                // appLog.debug(
                //   'Matching route %O',
                //   handler.match,
                //   window.location.pathname
                // );
                return window.location.pathname.match(handler.match.location);
              }
              return false;
            });

            if (routeHandlerKey) {
              const { handle, ...routeHandlerOpts } = handlers[
                routeHandlerKey
              ] as RouteObserverHandler;
              appLog.debug(
                'Matched route handler key %s: %O',
                routeHandlerKey,
                routeHandlerOpts
              );

              handle(window.document.body, routeHandlerOpts, routeHandlerKey, {
                ...config,
                href: window.location.toString(),
              } as any);
            }
          }
        }
      },
      500,
      { trailing: true }
    )
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

export interface App {
  config: UserSettings;
  reload: (c: UserSettings) => void;
  destroy: () => void;
}

let config: any;

/**
 * Transform functions that send messages to background
 * to promises for better code flow.
 */

const jsonSettingsP = (): Promise<Response<Partial<UserSettings>>> =>
  new Promise((resolve) => settingsLookup(resolve));

const partialLocalLookupP = (): Promise<Response<Partial<UserSettings>>> =>
  new Promise((resolve) => partialLocalLookup(resolve));

const serverHandshakeP = (
  p: ServerLookup['payload']
): Promise<Response<HandshakeResponse>> =>
  new Promise((resolve) => serverLookup(p, resolve));

let loading = false;
let app: App | undefined;
export async function boot<
  S = any,
  M = any,
  C extends ParserConfiguration = ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>> = any
>(opts: BootOpts<S, M, C, PP>): Promise<App> {
  if (app) {
    appLog.debug('App already booted!');
    return app;
  }
  if (loading) {
    appLog.debug('boot in progress...');
    return Promise.resolve({
      config: {} as any,
      reload: () => {},
      destroy: () => {},
    });
  }
  loading = true;
  appLog.info('booting with config', opts.payload);

  // connect to a port to listen for `config` changes dispatched from background
  const configUpdatePort = bo.runtime.connect({ name: 'ConfigUpdate' });

  // listen on "ConfigUpdate" port for messages
  configUpdatePort.onMessage.addListener(function (message, sender) {
    appLog.debug('Received message on "ConfigUpdate" port %O', message);
    if (message.type === 'ReloadApp') {
      app?.reload(message.payload);
      return true;
    }
    return false;
  });

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
  appLog.info(
    'retrieved settings from json file (settings.json) %O',
    jsonSettings
  );

  // Lookup the current user and initialize keys only when not defined in json settings
  const localSettings = await partialLocalLookupP();

  if (localSettings.type === 'Error') {
    throw localSettings.error;
  }

  // merge settings taken from db with ones defined in settings.json, giving the precedence to the latter
  const settings: UserSettings = {
    ...localSettings.result,
    ...jsonSettings.result,
  } as any;

  if (!settings.publicKey || !settings.secretKey) {
    const keys = initializeKey();
    appLog.info('Settings misses key pair, creating new one: %O', keys);
    settings.publicKey = keys.publicKey;
    settings.secretKey = keys.secretKey;
  }

  // save settings in db, so they're properly retrieved on the next bootstrap
  await db.set(FIXED_USER_NAME, settings);

  if (!settings.active) {
    appLog.info('extension disabled!');
    app = {
      config: settings,
      reload: (c) => {
        appLog.debug('inactive section needs reload', c);
        app = undefined;
        loading = false;
        void boot(opts);
      },
      destroy: () => {
        configUpdatePort.disconnect();
        opts.hub.hub.clear();
      },
    };
    loading = false;
    return app;
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

  // render shared ui if configuration is given
  if (opts.ui) {
    renderUI({ hub: opts.hub.hub, ...opts.ui });
  }

  // because the URL has been for sure reloaded, be sure to also clear cache
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
  app = {
    config,
    reload: (c) => {
      appLog.debug('Reloading app with config %O', c);
      observer.disconnect();
      opts.hub.hub.dispatch({
        type: 'WindowUnload',
      });
      opts.hub.hub.clear();
      opts.hub.onRegister(opts.hub.hub, c);
      observer = undefined as any;
      observer = setupObserver(opts.observe, c);
    },
    destroy: () => {
      observer.disconnect();
      opts.hub.hub.clear();
      app = undefined;
    },
  };

  loading = false;

  return app;
}
