// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome` space.

import { boot } from '@shared/extension/app';
import config from '@shared/extension/config';
import { bo } from '@shared/extension/utils/browser.utils';
import { metadataLoggerParserProps } from '@yttrex/shared/parser/metadata-logger';
import { youtubeDomainRegExp } from '@yttrex/shared/parser/selectors';
import * as hubHandlers from '../handlers/events';
import ytHub from '../handlers/hub';
import { onLocationChange, watchedPaths, ytLogger, ytTrexActions } from './app';

bo.runtime.sendMessage({ type: 'chromeConfig' }, (chromeConfig) => {
  ytLogger.info('Booting app with config %O', chromeConfig);
  try {
    const { ui, ...settings } = chromeConfig;
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
      ui: config.DEVELOPMENT
        ? {
            metadataLogger: metadataLoggerParserProps,
          }
        : undefined,
    });
  } catch (e) {
    // eslint-disable-next-line
    console.error('Error during bootstrap', e);
  }
});
