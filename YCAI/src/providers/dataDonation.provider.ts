import { GetDataDonationProvider } from '@shared/providers/dataDonation.provider';
import { config } from '../config';
import { browser } from './browser.provider';

export const dataDonation = GetDataDonationProvider({
  browser,
  debug: config.NODE_ENV === 'development',
  version: config.VERSION,
});

export { GetDataDonationProvider };
