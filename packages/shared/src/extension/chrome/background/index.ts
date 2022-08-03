import logger from '../../logger';
import { bo } from '../../utils/browser.utils';
import * as account from './account';
import * as reloadExtension from './reloadExtension';
import * as sync from './sync';

// bind the scoped message listener
export const load = (opts: sync.LoadOpts): void => {
  logger.debug(`Bind background events %O`, opts);
  sync.load(opts);
  reloadExtension.load();

  bo.runtime.onConnect.addListener((port) => {
    logger.debug('Port connected: %O', port);
    account.load(opts, (c) => {
      logger.debug('Config updated %O', c);
      if (port.name === 'ConfigUpdate') {
        port.postMessage({ type: 'Reload', payload: c });
        return true;
      }
    });
  });
};
