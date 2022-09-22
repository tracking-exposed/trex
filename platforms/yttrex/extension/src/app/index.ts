// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome` space.

import { boot } from '@shared/extension/app';
import { bo } from '@shared/extension/utils/browser.utils';
import { youtubeDomainRegExp } from '@yttrex/shared/parser/selectors';
import * as hubHandlers from '../handlers/events';
import ytHub from '../handlers/hub';
import { onLocationChange, watchedPaths, ytLogger, ytTrexActions } from './app';

bo.runtime.sendMessage({ type: 'chromeConfig' }, (config) => {
  ytLogger.info('Booting app with config %O', config);
  try {
    const { ui, ...settings } = config;
    void boot({
      payload: {
        href: window.location.href,
        execount: settings.execount ?? 0,
      } as any,
      mapLocalConfig: (c, { href, ...p }) => ({
        ...c,
        ...p,
        href,
      }),
      observe: {
        handlers: watchedPaths as any,
        platformMatch: youtubeDomainRegExp,
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
