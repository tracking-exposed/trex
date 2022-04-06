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
    const { ui, ...settings } = config;
    boot({
      payload: {
        newProfile: settings.isNew,
        href: window.location.href,
        execount: settings.execount ?? 0,
        testTime: new Date().toISOString(),
      } as any,
      mapLocalConfig: (c, { href, ...p }) => {
        return {
          config: {
            experimentId: '',
            evidencetag: '',
            directiveType: 'comparison',
            ...c,
            ...p,
          },
          href,
        } as any;
      },
      observe: {
        handlers: watchedPaths,
        onLocationChange,
      },
      hub: {
        hub: ytHub,
        onRegister: (hub, config) => {
          ytLogger.debug('Registering handlers to hub');
          // register platform handler
          hubHandlers.register(hub, config);
        },
      },
      onAuthenticated: ytTrexActions,
    });
  } catch (e) {
    // eslint-disable-next-line
    console.error('Error during bootstrap', e);
  }
});
