import logger from '../../logger';
import * as account from './account';
import * as reloadExtension from './reloadExtension';
import * as sync from './sync';

// bind the scoped message listener
export const load = (opts: sync.LoadOpts): void => {
  logger.debug(`Bind background events %O`, opts);
  account.load(opts);
  sync.load(opts);
  reloadExtension.load();
};
