import _ from 'lodash';
import { HandshakeResponse } from '../models/HandshakeBody';
import { clearCache } from '../providers/dataDonation.provider';
import { FIXED_USER_NAME, initializeKey } from './background/account';
import {
  partialLocalLookup,
  Response,
  serverLookup,
  settingsLookup,
} from './background/sendMessage';
import {
  // getFilter,
  WebRequestHandler,
} from './background/webRequest/filterRequest';
import db from './db';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import { Hub } from './hub';
import log from './logger';
import HubEvent from './models/HubEvent';
import { ServerLookup } from './models/Message';
import UserSettings from './models/UserSettings';
import { addCommonPageUI } from './ui';
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
    observe?: boolean;
  };
}

export interface SelectorWithParentsObserverHandler
  extends BaseObserverHandler {
  match: {
    type: 'selector-with-parents';
    selector: string;
    parents: number;
    observe?: boolean;
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
  webRequest?: {
    handlers: WebRequestHandler;
  };
  hub: {
    hub: Hub<any>;
    onRegister: (h: Hub<HubEvent>, config: UserSettings) => void;
  };
  onAuthenticated: (res: any) => void;
  ui?: {
    common: {
      id?: string;
      errors?: boolean;
    };
  };
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
  { handlers: _handlers, platformMatch, onLocationChange }: SetupObserverOpts,
  settings: UserSettings
): MutationObserver {
  // group handlers by type and `ObserverHandler.observe?`
  // to subscribe them to proper DOM and location changes
  const handlers = Object.entries(_handlers).reduce<{
    selectors: Array<
      [string, SelectorObserverHandler | SelectorWithParentsObserverHandler]
    >;
    observableSelectors: Array<
      [string, SelectorObserverHandler | SelectorWithParentsObserverHandler]
    >;
    routes: Array<[string, RouteObserverHandler]>;
  }>(
    (acc, [h, handler]) => {
      const { match } = handler;
      if (match.type === 'selector' || match.type === 'selector-with-parents') {
        if (match.observe) {
          acc.observableSelectors.push([
            h,
            handler as SelectorWithParentsObserverHandler,
          ]);
        } else {
          acc.selectors.push([
            h,
            handler as SelectorWithParentsObserverHandler,
          ]);
        }
      } else if (handler.match.type === 'route') {
        acc.routes.push([h, handler as RouteObserverHandler]);
      }
      return acc;
    },
    { selectors: [], observableSelectors: [], routes: [] }
  );

  // register selector and 'selector-with-parents' handlers
  handlers.selectors.forEach(([h, { handle, ...handler }]) => {
    appLog.debug('handler listen for mutation %O', handler);
    dom.on(handler.match.selector, (node) =>
      handle(node, handler, h, {
        ...settings,
        href: window.location.toString(),
      } as any)
    );
  });

  /* and monitor href changes to randomize a new accessId */
  const body = window.document.querySelector('body');

  const observer = new MutationObserver(
    _.debounce(
      (mutations: MutationRecord[]) => {
        appLog.info('mutations %O', mutations);

        if (window?.document) {
          if (platformMatch.test(window.location.href)) {
            // always trigger handlers with `observe` equals to `true`
            handlers.observableSelectors.forEach(
              ([h, { handle, ...handler }]) => {
                // appLog.debug('Handler for mutation %s', h);
                mutations.forEach((r) => {
                  // appLog.debug('Mutation target %s', (r.target as Element).id);
                  if (`#${(r.target as any).id}` === handler.match.selector) {
                    // appLog.debug('Target match %O', (r.target as any).id);
                    handle(r.target as any, handler, h, settings);
                  }
                });
              }
            );

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

            // look for handler for the current path
            const routeHandler = handlers.routes.find(([h, handler]) => {
              return window.location.pathname.match(handler.match.location);
            });

            // invoke the route handler, if any
            if (routeHandler?.[0]) {
              const { handle, ...routeHandlerOpts } = routeHandler[1];
              appLog.debug(
                'Matched route handler key %s: %O',
                routeHandler[0],
                routeHandlerOpts
              );

              handle(window.document.body, routeHandlerOpts, routeHandler[0], {
                ...settings,
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
    // attributes: true,
    childList: true,
    subtree: true,
  };

  window.addEventListener('unload', () => {
    appLog.debug('Window unloading, disconnect the observer...');
    observer?.disconnect();
    // TODO: maybe destroy the app?
    // app?.destroy();
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
let config: any;

export async function boot(opts: BootOpts): Promise<App> {
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
    ...jsonSettings.result,
    ...localSettings.result,
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

  // emergency button should be used when a supported with
  // UX hack in place didn't see any UX change, so they
  // can report the problem and we can handle it.
  // initializeEmergencyButton();

  // because the URL has been for sure reloaded, be sure to
  // clear cache too
  clearCache();

  // enable the ui
  if (settings.ux) {
    addCommonPageUI(
      opts.ui?.common.id ?? 'trex-extension-common-ui',
      opts.hub.hub,
      settings.ux
        ? {
            errors: true,
          }
        : settings.ux
    );
  }

  // if (opts.webRequest && bo.webRequest) {
  //   bo.webRequest.onBeforeRequest.addListener(
  //     (d) => {
  //       Object.entries(opts.webRequest?.handlers ?? []).forEach(
  //         ([key, handler]) => {
  //           getFilter(d, handler);
  //         }
  //       );
  //     },
  //     { urls: ['https://*/*'], types: ['main_frame', 'xmlhttprequest'] },
  //     ['blocking']
  //   );
  // }

  // send the configuration to the server to register the extension
  const handshakeResponse = await serverHandshakeP(config);

  appLog.info('Server lookup cb %O', handshakeResponse);
  if (handshakeResponse.type === 'Error') {
    opts.hub.hub.dispatch({
      type: 'ErrorEvent',
      payload: handshakeResponse.error,
    });
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
