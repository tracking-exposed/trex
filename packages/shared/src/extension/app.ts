import { debounce } from '@material-ui/core';
import _ from 'lodash';
import { clearCache } from '../providers/dataDonation.provider';
import { localLookup, serverLookup } from './chrome/background/sendMessage';
import { Config } from './config';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import { Hub } from './hub';
import log from './logger';
import HubEvent from './models/HubEvent';
import { ServerLookup } from './models/Message';

// instantiate a proper logger
const appLog = log.extend('app');

export interface BaseObserverHandler {
  color?: string;
  handle: (
    n: HTMLElement,
    opts: Omit<ObserverHandler, 'handle'>,
    selectorName: string
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

interface BootOpts {
  payload: ServerLookup['payload'];
  mapLocalConfig: (c: Config, payload: ServerLookup['payload']) => Config;
  observe: SetupObserverOpts;
  hub: {
    hub: Hub<any>;
    onRegister: (h: Hub<HubEvent>, config: Config) => void;
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
function setupObserver({
  handlers,
  platformMatch,
  onLocationChange,
}: SetupObserverOpts): MutationObserver {
  const handlersList = Object.keys(handlers);
  // register selector and 'selector-with-parents' handlers
  handlersList.forEach((h) => {
    const { handle, ...handler } = handlers[h];
    if (
      handler.match.type === 'selector' ||
      handler.match.type === 'selector-with-parents'
    ) {
      dom.on(handler.match.selector, (node) => handle(node, handler, h));
    }
  });

  // appLog.debug('handlers installed %O', handlers);

  /* and monitor href changes to randomize a new accessId */
  const body = window.document.querySelector('body');

  const observer = new MutationObserver(
    debounce((mutations) => {
      mutations.forEach(function (mutation) {
        // appLog.debug('mutation (%s) %O', mutation.type, mutation.target);

        if (window?.document) {
          if (
            oldHref !== window.location.href &&
            platformMatch.test(window.location.href)
          ) {
            const newHref = window.location.href;

            appLog.debug(
              `%s changed to %s, calling onLocationChange`,
              oldHref,
              newHref
            );

            onLocationChange(oldHref, newHref);

            const routeHandlerKey = handlersList.find((h) => {
              const handler = handlers[h];

              if (handler.match.type === 'route') {
                return window.location.pathname.match(handler.match.location);
              }
              return false;
            });

            if (routeHandlerKey) {
              appLog.debug('Route handler key %s', routeHandlerKey);
              const { handle, ...routeHandlerOpts } = handlers[routeHandlerKey];
              handle(window.document.body, routeHandlerOpts, routeHandlerKey);
            }

            oldHref = newHref;
          }
        }
      });
    }, 300)
  );

  const config = {
    childList: true,
    subtree: true,
  };

  window.addEventListener('unload', () => {
    appLog.debug('Window unloading, disconnect the observer...');
    observer.disconnect();
  });

  if (body) {
    observer.observe(body, config);
  } else {
    appLog.error('setupObserver: body not found');
  }

  return observer;
}

/* Boot the application by giving a callback that
 * will be invoked after the handshake with API server.
 */

interface App {
  destroy: () => void;
}

let config: any;
export async function boot(opts: BootOpts): Promise<App> {
  appLog.info('booting with config', opts.payload);

  return new Promise((resolve) => {
    // Register all common event handlers.
    // An event handler is a piece of code responsible for a specific task.
    // You can learn more in the [`./handlers`](./handlers/index.html) directory.
    registerHandlers(opts.hub.hub);

    // Lookup the current user and decide what to do.
    localLookup((response) => {
      if (response.type === 'Error') {
        throw response.error;
      }

      const settings = response.result;
      // `response` contains the user's public key, we save it global for the blinks
      appLog.info('retrieved locally stored user settings %O', settings);

      if (!settings.active) {
        appLog.info('extension disabled!');
        return resolve({
          destroy: () => {
            opts.hub.hub.clear();
          },
        });
      }

      /* these parameters are loaded from localStorage */
      config = opts.mapLocalConfig(settings as any, opts.payload);

      // this is needed by guardoni to retrieve the current publicKey
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

      serverLookup(config, (response) => {
        appLog.info('Server lookup cb %O', response);
        if (response.type === 'Error') {
          throw response.error;
        }
        const observer = setupObserver(opts.observe);
        opts.onAuthenticated(response.result);

        const context = {
          destroy: () => {
            opts.hub.hub.clear();
            observer.disconnect();
          },
        };

        resolve(context);
      });
    });
  });
}
