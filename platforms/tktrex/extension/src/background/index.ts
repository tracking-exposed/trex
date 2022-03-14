// the background doesn't need to be invoked,
// so the import is sufficient
import { load } from '@shared/extension/chrome/background/index';
import api from './api';

load({
  api: api.API,
  getHeadersForDataDonation: async (req) => {
    const headers = {};
    return headers;
  },
});
