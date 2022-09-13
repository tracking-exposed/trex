import { GetDataDonationProvider } from '@shared/providers/dataDonation.provider';
import * as Endpoints from '@yttrex/shared/endpoints';
import { config } from '../config';
import { browser } from './browser.provider';

const watchedPaths = {
  banner: {
    selector: '.video-ads.ytp-ad-module',
    parents: 4,
    color: 'blue',
  },
  ad: {
    selector: '.ytp-ad-player-overlay',
    parents: 4,
    color: 'darkblue',
  },
  overlay: {
    selector: '.ytp-ad-player-overlay-instream-info',
    parents: 4,
    color: 'lightblue',
  },
  toprightad: {
    selector: 'ytd-promoted-sparkles-web-renderer',
    parents: 3,
    color: 'aliceblue',
  },
  toprightpict: {
    selector: '.ytd-action-companion-ad-renderer',
    parents: 2,
    color: 'azure',
  },
  toprightcta: {
    selector: '.sparkles-light-cta',
    parents: 1,
    color: 'violetblue',
  },
  toprightattr: {
    selector: '[data-google-av-cxn]',
    color: 'deeppink',
  },
  adbadge: {
    selector: '#ad-badge',
    parents: 4,
    color: 'deepskyblue',
  },
  frontad: {
    selector: 'ytd-banner-promo-renderer',
  },
  channel1: {
    selector: '[href^="/channel"]',
    color: 'yellow',
    parents: 1,
  },
  channel2: {
    selector: '[href^="/c"]',
    color: 'yellow',
    parents: 1,
  },
  channel3: {
    selector: '[href^="/user"]',
    color: 'yellow',
    parents: 1,
  },
  searchcard: { selector: '.ytd-search-refinement-card-renderer' },
  // channellink: { selector: '.channel-link' },
  searchAds: {
    selector: '.ytd-promoted-sparkles-text-search-renderer',
    parents: 2,
  },
};

export const dataDonation = GetDataDonationProvider({
  browser,
  debug: config.NODE_ENV === 'development',
  version: config.VERSION,
  watchedPaths,
  addEvent: Endpoints.v2.Public.AddEvents as any,
});

export { GetDataDonationProvider };
