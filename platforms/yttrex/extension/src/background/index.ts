import { load } from '@shared/extension/background/index';
import api, { getHeadersForDataDonation } from './api';
import './chromeConfig';

load({
  api: api.API,
  getHeadersForDataDonation,
});
