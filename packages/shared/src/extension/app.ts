import { localLookup, serverLookup } from './chrome/background/sendMessage';
import config from './config';
import { registerHandlers } from './handlers/index';
import hub, { Hub } from './hub';
import log from './logger';
import { clearCache } from '../providers/dataDonation.provider';
import { ServerLookup } from './models/Message';
import * as dom from './dom';
import _ from 'lodash';
import HubEvent from './models/HubEvent';

// instantiate a proper logger
const appLog = log.extend('app');

export interface ObserverHandler {
  selector: string;
  color?: string;
  parents?: number;
  handle: (n: HTMLElement, opts: Omit<ObserverHandler, 'handle'>) => void;
}

interface SetupObserverOpts {
  handlers: {
    [key: string]: ObserverHandler;
  };
  onLocationChange: (oldLocation: string, newLocation: string) => void;
}

interface BootOpts {
  payload: ServerLookup['payload'];
  observe: SetupObserverOpts;
  hub: { onRegister: (h: Hub<HubEvent>) => void };
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

/**
 * setup the mutation observer with
 * given callbacks for selectors
 */
function setupObserver({
  handlers,
  onLocationChange,
}: SetupObserverOpts): void {
  Object.keys(handlers).forEach((h) => {
    const { handle, ...handler } = handlers[h];
    dom.on(handler.selector, (node) => handle(node, handler));
  });

  appLog.info('listeners installed, selectors', handlers);

  /* and monitor href changes to randomize a new accessId */
  let oldHref = window.location.href;
  const body = document.querySelector('body');

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (oldHref !== window.location.href) {
        appLog.debug(`%s changed to %s, calling onLocationChange`, oldHref, window.location.href);
        onLocationChange(oldHref, window.location.href);
        oldHref = window.location.href;
      }
    });
  });

  const config = {
    childList: true,
    subtree: true,
  };

  if (body) {
    observer.observe(body, config);
  } else {
    appLog.error('setupObserver: body not found');
  }
}

/* Boot the application by giving a callback that
 * will be invoked after the handshake with API server.
 */
export function boot(opts: BootOpts): void {
  appLog.info('booting with config', config);

  // Register all common event handlers.
  // An event handler is a piece of code responsible for a specific task.
  // You can learn more in the [`./handlers`](./handlers/index.html) directory.
  registerHandlers(hub);

  // register platform specific event handlers
  opts.hub.onRegister(hub);

  // Lookup the current user and decide what to do.
  localLookup((settings) => {
    // `response` contains the user's public key, we save it global for the blinks
    appLog.info('retrieved locally stored user settings', settings);
    // this output is interpreted and read by guardoni

    /* these parameters are loaded from localStorage */
    config.publicKey = settings.publicKey;
    config.active = settings.active;
    config.ux = settings.ux;

    if (!config.active) {
      appLog.info('trex disabled!');
      return null;
    }

    // emergency button should be used when a supported with
    // UX hack in place didn't see any UX change, so they
    // can report the problem and we can handle it.
    // initializeEmergencyButton();

    // because the URL has been for sure reloaded, be sure to also
    clearCache();
    serverLookup(opts.payload, (res) => {
      setupObserver(opts.observe);
      opts.onAuthenticated(res);
    });
  });
}
