// the background doesn't need to be invoked,
// so the import is sufficient
import { load } from '@shared/extension/chrome/background/index';
import config from '@shared/extension/config';
import { GetAPI } from '@shared/providers/api.provider';

const api = GetAPI({
  baseURL: config.API_ROOT,
  getAuth: async (req) => req,
  onUnauthorized: async (res) => res,
});

load({
  api: api.API,
  getHeadersForDataDonation: async (req) => {
    const headers = {};
    return headers;
  },
});
