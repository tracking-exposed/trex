import {
  RouteObserverHandler,
  SelectorObserverHandler,
  SelectorWithParentsObserverHandler,
} from '@shared/extension/app';

// Considering the extension only runs on *.youtube.com
// we want to make sure the main code is executed only in
// website portion actually processed by us. If not, the
// blink maker would blink in BLUE.
// This code is executed by a window.setInterval because
// the location might change

// youtube domain reg exp
export const youtubeDomainRegExp = /http(?:s?):\/\/(?:www\.)?youtube\.com/;

export const consideredURLs = {
  home: /^\/$/,
  video: /^\/watch$/,
  search: /^\/results$/,
  hashtag: /^\/hashtag/,
  feed: /^\/feed/,
  channel: /^\/channel/,
};

interface RouteSelectors {
  [key: string]: Omit<RouteObserverHandler, 'handle'>;
}

export const routeSelectors: RouteSelectors = {
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

interface MatchSelectors {
  [key: string]: Omit<
    SelectorObserverHandler | SelectorWithParentsObserverHandler,
    'handle'
  >;
}

export const leafSelectors: MatchSelectors = {
  banner: {
    match: {
      type: 'selector-with-parents',
      parents: 4,
      selector: '.video-ads.ytp-ad-module',
      observe: true,
    },
    color: 'blue',
  },
  videoPlayerAd: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay',
      parents: 4,
      observe: true,
    },
    color: 'darkblue',
  },
  overlay: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay-instream-info',
      parents: 4,
      observe: true,
    },
    color: 'lightblue',
  },
  toprightad: {
    match: {
      type: 'selector-with-parents',
      selector: 'ytd-promoted-sparkles-web-renderer',
      parents: 3,
      observe: true,
    },
    color: 'aliceblue',
  },
  toprightpict: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-action-companion-ad-renderer',
      parents: 2,
      observe: true,
    },
    color: 'azure',
  },
  toprightcta: {
    match: {
      type: 'selector-with-parents',
      selector: '.sparkles-light-cta',
      parents: 1,
      observe: true,
    },
    color: 'violetblue',
  },
  toprightattr: {
    match: {
      type: 'selector',
      selector: '[data-google-av-cxn]',
      observe: true,
    },
    color: 'deeppink',
  },
  adbadge: {
    match: {
      type: 'selector-with-parents',
      selector: '#ad-badge',
      parents: 4,
      observe: true,
    },
    color: 'deepskyblue',
  },
  frontad: {
    match: {
      type: 'selector',
      selector: 'ytd-banner-promo-renderer',
      observe: true,
    },
  },
  // video-ad-overlay-slot
  channel1: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/channel"]',
      parents: 1,
      observe: true,
    },
    color: 'yellow',
  },
  channel2: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/c"]',
      parents: 1,
      observe: true,
    },
    color: 'yellow',
  },
  channel3: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/user"]',
      parents: 1,
      observe: true,
    },
    color: 'yellow',
  },
  searchcard: {
    match: {
      type: 'selector',
      selector: '.ytd-search-refinement-card-renderer',
      observe: true,
    },
  },
  channellink: {
    match: {
      type: 'selector',
      selector: '.channel-link',
      observe: true,
    },
  },
  searchAds: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-promoted-sparkles-text-search-renderer',
      parents: 2,
      observe: true,
    },
  },
};

export const selectors = {
  ...routeSelectors,
  ...leafSelectors,
};
