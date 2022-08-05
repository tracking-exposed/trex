// the background doesn't need to be invoked,
// so the import is sufficient
import { load } from '@shared/extension/background/index';
import api, { getHeadersForDataDonation } from './api';

load({
  api: api.API,
  getHeadersForDataDonation,
});
