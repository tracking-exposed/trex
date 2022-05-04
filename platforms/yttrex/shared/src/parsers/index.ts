import { ObserverHandler } from '@shared/extension/app';

// Considering the extension only runs on *.youtube.com
// we want to make sure the main code is executed only in
// website portion actually processed by us. If not, the
// blink maker would blink in BLUE.
// This code is executed by a window.setInterval because
// the location might change

export const consideredURLs = {
  home: /^\/$/,
  video: /^\/watch$/,
  search: /^\/results$/,
  hashtag: /^\/hashtag/,
  feed: /^\/feed/,
  channel: /^\/channel/,
};

interface Selectors {
  [key: string]: Omit<ObserverHandler, 'handle'>;
}

const routeSelectors: Selectors = {
  home: {
    match: {
      type: 'route',
      location: consideredURLs.home,
    },
  },
  video: {
    match: {
      type: 'route',
      location: consideredURLs.video,
    },
  },
  search: {
    match: {
      type: 'route',
      location: consideredURLs.search,
    },
  },
};

const leafSelectors: Selectors = {
  banner: {
    match: {
      type: 'selector-with-parents',
      parents: 4,
      selector: '.video-ads.ytp-ad-module',
    },
    color: 'blue',
  },
  videoPlayerAd: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay',
      parents: 4,
    },
    color: 'darkblue',
  },
  overlay: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay-instream-info',
      parents: 4,
    },
    color: 'lightblue',
  },
  toprightad: {
    match: {
      type: 'selector-with-parents',
      selector: 'ytd-promoted-sparkles-web-renderer',
      parents: 3,
    },
    color: 'aliceblue',
  },
  toprightpict: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-action-companion-ad-renderer',
      parents: 2,
    },
    color: 'azure',
  },
  toprightcta: {
    match: {
      type: 'selector-with-parents',
      selector: '.sparkles-light-cta',
      parents: 1,
    },
    color: 'violetblue',
  },
  toprightattr: {
    match: {
      type: 'selector',
      selector: '[data-google-av-cxn]',
    },
    color: 'deeppink',
  },
  adbadge: {
    match: {
      type: 'selector-with-parents',
      selector: '#ad-badge',
      parents: 4,
    },
    color: 'deepskyblue',
  },
  frontad: {
    match: {
      type: 'selector',
      selector: 'ytd-banner-promo-renderer',
    },
  },
  // video-ad-overlay-slot
  channel1: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/channel"]',
      parents: 1,
    },
    color: 'yellow',
  },
  channel2: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/c"]',
      parents: 1,
    },
    color: 'yellow',
  },
  channel3: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/user"]',
      parents: 1,
    },
    color: 'yellow',
  },
  searchcard: {
    match: {
      type: 'selector',
      selector: '.ytd-search-refinement-card-renderer',
    },
  },
  channellink: {
    match: {
      type: 'selector',
      selector: '.channel-link',
    },
  },
  searchAds: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-promoted-sparkles-text-search-renderer',
      parents: 2,
    },
  },
};

export const selectors: Selectors = {
  ...routeSelectors,
  ...leafSelectors,
};
