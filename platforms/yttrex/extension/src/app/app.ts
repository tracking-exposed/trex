/* eslint-disable */
// # Welcome to the extension docs!
// Here you can learn how the extension works and, if this is what you aim for,
// where to put your hands to hack the code.
//
// ## Structure of the extension
// The extension has two parts:
//  - a content script
//  - event pages.
//
// The **content script** is the JavaScript code injected into the youtube.com
// website. It can interact with the elements in the page to scrape the data and
// prepare the payload to be sent to the API.
//
// On the other side there are **event pages**. They are scripts triggered by
// some events sent from the **content script**. Since they run in *browser-space*,
// they have the permission (if granted) to do cross-domain requests, access
// cookies, and [much more](https://developer.chrome.com/extensions/declare_permissions).
// All **event pages** are contained in the [`./background`](./background/app.html) folder.
// (the name is **background** for historical reasons and it might be subject of changes
// in the future).
//
// Naming:
//   - videoSequence is a list of youtube videos
//   - comparativePage is the place where users accept to reproduce a videoSequence

// Import other utils to handle the DOM and scrape data.

import { refreshUUID, ObserverHandler } from '@shared/extension/app';
import config from '@shared/extension/config';
import logger from '@shared/extension/logger';
import { sizeCheck } from '@shared/providers/dataDonation.provider';
import _ from 'lodash';
import { initializeBlinks, updateUI } from '../blink';
import consideredURLs from '../consideredURLs';
import hub from '../handlers/hub';

export const ytLogger = logger.extend('yt');

// // variable used to spot differences due to refresh and url change
let feedId = refreshUUID(0);
let feedCounter = 0;
let leavesCounter = 0;

// to optimize the amount of reported data, we used a local cache
let leavesCache: Record<string, any> = {};

const getOffsetLeft = (element: HTMLElement): number => {
  let offsetLeft = 0;
  while (element) {
    offsetLeft += element.offsetLeft;
    element = element.offsetParent as any;
  }
  return offsetLeft;
};

const getOffsetTop = (element: HTMLElement): number => {
  let offsetTop = 0;
  while (element) {
    offsetTop += element.offsetTop;
    element = element.offsetParent as any;
  }
  return offsetTop;
};

export function ytTrexActions(remoteInfo: any): void {
  /* these functions are the main activity made in
       content_script, and ytTrexActions is a callback
       after remoteLookup */
  ytLogger.info('remoteInfo available:', remoteInfo);

  initializeBlinks();

  flush();
}

function isValidURL(
  validURLs: Record<string, RegExp>,
  location: Location
): undefined | number {
  ytLogger.debug('Checking url %O', location);

  const result = _.reduce(
    Object.values(validURLs),
    function (memo, matcher, name) {
      if (memo) return memo;

      if (location.pathname.match(matcher)) {
        ytLogger.debug(
          'Location pathname (%s) matched for %O!',
          location.pathname,
          matcher
        );
        return name;
      }

      return memo;
    },
    undefined as any
  );

  return result;
}

let lastMeaningfulURL: string;
let urlkind: number | undefined;
export function onLocationChange(
  oldLocation: string,
  newLocation: string
): void {
  ytLogger.debug('Location changed: %s - %s', oldLocation, newLocation);
  const diff = newLocation !== lastMeaningfulURL;

  // Considering the extension only runs on *.youtube.com
  // we want to make sure the main code is executed only in
  // website portion actually processed by us. If not, the
  // blink maker would blink in BLUE.
  // This code is executed by a window.setInterval because
  // the location might change
  urlkind = isValidURL(consideredURLs, window.location);

  if (urlkind === undefined || urlkind < 0) {
    ytLogger.debug("URL doesn't match any valid url...");
    updateUI('video.wait');
    return;
  }

  ytLogger.debug(
    'Diff from last meaningful url (%s)?',
    lastMeaningfulURL,
    diff
  );

  if (diff) {
    // client might duplicate the sending of the same
    // content, that's 'versionsSent' counter
    // using a random identifier (randomUUID), we spot the
    // clones and drop them server side.
    // also, here is cleaned the cache declared below
    updateUI('video.seen');
    lastMeaningfulURL = window.location.href;
    feedCounter++;
    feedId = refreshUUID(feedCounter);
    ytLogger.info(
      'new feedId (%s), feed counter (%d) and video counter resetting after poking (%d)',
      feedId,
      feedCounter,
      leavesCounter
    );
    leavesCounter = 0;
  }
}

export const handleLeaf = (
  node: HTMLElement,
  opts: Omit<ObserverHandler, 'handle'>
): void => {
  // command has .selector .parents .preserveInvisible (this might be undefined)
  ytLogger.info('Handle "leaf" type: %j', opts.match);
  console.log(node);
  // ytLogger.debug('node %o with %o', node, opts);
  const offsetTop = getOffsetTop(node);
  const offsetLeft = getOffsetLeft(node);

  // this to highlight what is collected as fragments
  if (config.ux) {
    const style = {
      border: `1px solid ${opts.color ? opts.color : 'red'}`,
    };
    ytLogger.debug('use custom style for %s development %O', opts.match.type, style);
    node.style.border = style.border;
    // node.setAttribute(opts.selector, 'true');
    // node.setAttribute('yttrex', '1');
  }

  if (opts.match.type === 'selector-with-parents') {
    let parentNode: Node | undefined;
    // if escalation to parents, highlight with different color

    parentNode = _.reduce<number, Node | undefined>(
      _.times(opts.match.parents),
      (acc) => {
        // ytLogger.debug('collecting parent', (opts.match as any).selector, acc);
        return acc?.parentNode ?? undefined;
      },
      node
    );

    if (config.ux) {
      (parentNode as any).style.border = `2px dotted ${
        opts.color ? opts.color : 'red'
      }`;
    }

    // ytLogger.debug('Parent node', parentNode);

    const html = (parentNode as any)?.outerHTML as string;
    const hash = html.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    if (leavesCache[hash]) {
      leavesCache[hash]++;

      // console.log(
      //   'ignoring because of cache',
      //   hash,
      //   leavesCache[hash],
      //   opts.match
      // );

      return;
    }

    // most of the time this doesn't happens: duplication are many!
    // is debug-worthy remove the 'return' and send cache counter.
    leavesCache[hash] = 1;

    // helpful only at development time:
    // const extra = extractor.mineExtraMetadata(selectorName, acquired);
    // console.table(extra);

    hub.dispatch({
      type: 'leaf',
      payload: {
        html,
        hash,
        offsetTop,
        offsetLeft,
        href: window.location.href,
        selectorName: opts.match.selector,
        randomUUID: feedId,
      },
    });
    updateUI('adv.seen');
  }
};

export function handleVideo(node: HTMLElement): void {
  ytLogger.info('Handle "NewVideo"!');

  const sendableNode = document.querySelector('ytd-app');
  if (!sendableNode) {
    ytLogger.debug('html element with tag `ytd-app` not found, returning...');
    return;
  }

  if (!sizeCheck(sendableNode.outerHTML)) {
    ytLogger.debug('Page did not change much, returning...');
    return;
  }

  hub.dispatch({
    type: 'NewVideo',
    payload: {
      type: urlkind,
      element: sendableNode.outerHTML,
      size: sendableNode.outerHTML.length,
      href: window.location.href,
      randomUUID: feedId,
    },
  });
  updateUI('video.send');
}

export const watchedPaths: { [key: string]: ObserverHandler } = {
  home: {
    match: {
      type: 'route',
      location: consideredURLs.home,
    },
    handle: handleVideo,
  },
  video: {
    match: {
      type: 'route',
      location: consideredURLs.video,
    },
    handle: handleVideo,
  },
  search: {
    match: {
      type: 'route',
      location: consideredURLs.search,
    },
    handle: handleVideo,
  },
  banner: {
    match: {
      type: 'selector-with-parents',
      parents: 4,
      selector: '.video-ads.ytp-ad-module',
    },
    color: 'blue',
    handle: handleLeaf,
  },
  videoPlayerAd: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay',
      parents: 4,
    },
    color: 'darkblue',
    handle: handleLeaf,
  },
  overlay: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytp-ad-player-overlay-instream-info',
      parents: 4,
    },
    color: 'lightblue',
    handle: handleLeaf,
  },
  toprightad: {
    match: {
      type: 'selector-with-parents',
      selector: 'ytd-promoted-sparkles-web-renderer',
      parents: 3,
    },
    color: 'aliceblue',
    handle: handleLeaf,
  },
  toprightpict: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-action-companion-ad-renderer',
      parents: 2,
    },
    color: 'azure',
    handle: handleLeaf,
  },
  toprightcta: {
    match: {
      type: 'selector-with-parents',
      selector: '.sparkles-light-cta',
      parents: 1,
    },
    color: 'violetblue',
    handle: handleLeaf,
  },
  toprightattr: {
    match: {
      type: 'selector',
      selector: '[data-google-av-cxn]',
    },
    color: 'deeppink',
    handle: handleLeaf,
  },
  adbadge: {
    match: {
      type: 'selector-with-parents',
      selector: '#ad-badge',
      parents: 4,
    },
    color: 'deepskyblue',
    handle: handleLeaf,
  },
  frontad: {
    match: {
      type: 'selector',
      selector: 'ytd-banner-promo-renderer',
    },
    handle: handleLeaf,
  },
  // video-ad-overlay-slot
  /*
  channel1: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/channel"]',
      parents: 1,
    },
    color: 'yellow',
    handle: handleLeaf,
  },
  channel2: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/c"]',
      parents: 1,
    },
    color: 'yellow',
    handle: handleLeaf,
  },
  channel3: {
    match: {
      type: 'selector-with-parents',
      selector: '[href^="/user"]',
      parents: 1,
    },
    color: 'yellow',

    handle: handleLeaf,
  }, */
  searchcard: {
    match: {
      type: 'selector',
      selector: '.ytd-search-refinement-card-renderer',
    },
    handle: handleLeaf,
  },
  channellink: {
    match: {
      type: 'selector',
      selector: '.channel-link',
    },
    handle: handleLeaf,
  },
  searchAds: {
    match: {
      type: 'selector-with-parents',
      selector: '.ytd-promoted-sparkles-text-search-renderer',
      parents: 2,
    },
    handle: handleLeaf,
  },
};

function flush() {
  window.addEventListener('beforeunload', (e) => {
    hub.dispatch({ type: 'WindowUnload' });
  });
}
