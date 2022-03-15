// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome` space.

import { boot } from '@shared/extension/app';
import { bo } from '@shared/extension/utils/browser.utils';
import * as hubHandlers from '../handlers/events';
import ytHub from '../handlers/hub';
import { onLocationChange, watchedPaths, ytLogger, ytTrexActions } from './app';

bo.runtime.sendMessage({ type: 'chromeConfig' }, (config) => {
  ytLogger.info('Booting app with config %O', config);
  try {
    boot({
      payload: {
        config,
        href: window.location.href,
      } as any,
      observe: {
        handlers: watchedPaths,
        onLocationChange,
      },
      hub: {
        hub: ytHub,
        onRegister: (hub) => {
          ytLogger.debug('Registering handlers to hub');
          // register platform handler
          hubHandlers.register(hub);
        },
      },
      onAuthenticated: ytTrexActions,
    });
  } catch (e) {
    // eslint-disable-next-line
    console.error('Error during bootstrap', e);
  }
});
