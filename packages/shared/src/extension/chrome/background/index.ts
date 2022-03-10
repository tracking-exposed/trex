import * as account from './account';
import * as reloadExtension from './reloadExtension';
import * as sync from './sync';

// bind the scoped message listener
export const load = (opts: sync.LoadOpts): void => {
  account.load();
  sync.load(opts);
  reloadExtension.load();
};
