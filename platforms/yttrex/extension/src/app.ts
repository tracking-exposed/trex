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
import _, { isDate } from 'lodash';
import config from './config';
import hub from './hub';
import { updateUI, initializeBlinks } from './blink';
import consideredURLs from './consideredURLs';
import { boot } from '@shared/extension/app';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import { ObserverHandler } from '@shared/extension/app';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
// const bo = chrome || browser;

// variable used to spot differences due to refresh and url change
let randomUUID =
  'INIT' +
  Math.random().toString(36).substring(2, 13) +
  Math.random().toString(36).substring(2, 13);

// to optimize the amount of reported data, we used a local cache
let lastObservedSize = 1;
let leavesCache: Record<string, any> = {};

function ytTrexActions(remoteInfo: any): void {
  /* these functions are the main activity made in 
       content_script, and ytTrexActions is a callback
       after remoteLookup */
  console.log('remoteInfo available:', remoteInfo);

  initializeBlinks();

  flush();
}

function processableURL(
  validURLs: Record<string, RegExp>,
  location: Location
): undefined | number {
  return _.reduce(
    Object.values(validURLs),
    function (memo, matcher, name) {
      if (memo) return memo;

      if (location.pathname.match(matcher)) {
        return name;
      }

      return memo;
    },
    undefined as any
  );
}

let lastMeaningfulURL: string;
let urlkind: number | undefined;
function onLocationChange(oldLocation: string, newLocation: string): void {
  const diff = newLocation !== lastMeaningfulURL;

  if (diff) {
    // Considering the extension only runs on *.youtube.com
    // we want to make sure the main code is executed only in
    // website portion actually processed by us. If not, the
    // blink maker would blink in BLUE.
    // This code is executed by a window.setInterval because
    // the location might change
    urlkind = processableURL(consideredURLs, window.location);

    if (!urlkind) {
      updateUI('video.wait');
      return;
    }

    // client might duplicate the sending of the same
    // content, that's 'versionsSent' counter
    // using a random identifier (randomUUID), we spot the
    // clones and drop them server side.
    // also, here is cleaned the cache declared below
    updateUI('video.seen');
    lastMeaningfulURL = window.location.href;
    cleanCache();
    refreshUUID();
  }
}

function sizeCheck(nodeHTML: string): boolean {
  // this function look at the LENGTH of the proposed element.
  // this is used in video because the full html body page would be too big.
  const s = _.size(nodeHTML);

  // check if the increment is more than 4%, otherwise is not interesting
  const percentile = 100 / s;
  const percentage = _.round(percentile * lastObservedSize, 2);

  if (percentage > 95) {
    // console.log(`Skipping update as ${percentage}% of the page is already sent (size ${s}, lastObservedSize ${lastObservedSize}) ${window.location.pathname}`);
    return false;
  }

  // this is the minimum size worthy of reporting
  if (s < 100000) {
    console.log('Too small to consider!', s);
    return false;
  }

  // console.log(`Valid update as a new ${_.round(100-percentage, 2)}% of the page have been received (size ${s}, lastObservedSize ${lastObservedSize}) ${window.location.pathname}`);
  lastObservedSize = s;
  return true;
}

const handleAd = _.debounce(
  (node: HTMLElement, opts: Omit<ObserverHandler, 'handle'>): void => {
    // command has .selector .parents .preserveInvisible (this might be undefined)

    const offsetTop = getOffsetTop(node);
    const offsetLeft = getOffsetLeft(node);

    // this to highlight what is collected as fragments
    if (config.ux) {
      node.style.border = '1px solid ' + (opts.color ? opts.color : 'red');
      node.setAttribute(opts.selector, 'true');
      node.setAttribute('yttrex', '1');
    }

    // if escalation to parents, highlight with different color
    // if (command.parents) {
    //   selected = _.reduce(
    //     _.times(command.parents),
    //     function (memo) {
    //       // console.log("collecting parent", selectorName, memo.tagName, memo.parentNode.tagName);
    //       return memo.parentNode;
    //     },
    //     selected
    //   );

    //   if (config.ux) selected.style.border = '3px dotted green';
    // }

    // if (command.screen) {
    // no screencapture capability in the extension
    // }

    const html = node.outerHTML;
    const hash = html.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    if (leavesCache[hash]) {
      leavesCache[hash]++;
      return;
      console.log(
        'ignoring because of cache',
        hash,
        leavesCache[hash],
        opts.selector
      );
    }
    // most of the time this doesn't happens: duplication are many!
    // is debug-worthy remove the 'return' and send cache counter.

    leavesCache[hash] = 1;
    // as it is the first observation, take infos and send it
    const acquired = {
      html,
      hash,
      offsetTop,
      offsetLeft,
      href: window.location.href,
      selectorName: opts.selector,
      randomUUID,
    };

    // helpful only at development time:
    // const extra = extractor.mineExtraMetadata(selectorName, acquired);
    // console.table(extra);

    hub.event('newInfo', acquired);
    updateUI('adv.seen');
  },
  300
);

const handleVideo = _.debounce((node: HTMLElement): void => {
  const sendableNode = document.querySelector('ytd-app');
  if (!sendableNode) {
    return;
  }

  if (!sizeCheck(sendableNode.outerHTML)) return;

  hub.event('newVideo', {
    type: urlkind,
    element: sendableNode.outerHTML,
    size: sendableNode.outerHTML.length,
    href: window.location.href,
    randomUUID,
  });
  updateUI('video.send');
}, 1000);

const watchedPaths = {
  video: {
    selector: 'h1.title',
    handle: handleVideo,
  },
  banner: {
    selector: '.video-ads.ytp-ad-module',
    parents: 4,
    color: 'blue',
    handle: handleAd,
  },
  ad: {
    selector: '.ytp-ad-player-overlay',
    parents: 4,
    color: 'darkblue',
    handle: handleAd,
  },
  overlay: {
    selector: '.ytp-ad-player-overlay-instream-info',
    parents: 4,
    color: 'lightblue',
    handle: handleAd,
  },
  toprightad: {
    selector: 'ytd-promoted-sparkles-web-renderer',
    parents: 3,
    color: 'aliceblue',
    handle: handleAd,
  },
  toprightpict: {
    selector: '.ytd-action-companion-ad-renderer',
    parents: 2,
    color: 'azure',
    handle: handleAd,
  },
  toprightcta: {
    selector: '.sparkles-light-cta',
    parents: 1,
    color: 'violetblue',
    handle: handleAd,
  },
  toprightattr: {
    selector: '[data-google-av-cxn]',
    color: 'deeppink',
    handle: handleAd,
  },
  adbadge: {
    selector: '#ad-badge',
    parents: 4,
    color: 'deepskyblue',
    handle: handleAd,
  },
  frontad: {
    selector: 'ytd-banner-promo-renderer',
    handle: handleAd,
  },
  // video-ad-overlay-slot
  channel1: {
    selector: '[href^="/channel"]',
    color: 'yellow',
    parents: 1,
    handle: handleAd,
  },
  channel2: {
    selector: '[href^="/c"]',
    color: 'yellow',
    parents: 1,
    handle: handleAd,
  },
  channel3: {
    selector: '[href^="/user"]',
    color: 'yellow',
    parents: 1,
    handle: () => {},
  },
  searchcard: {
    selector: '.ytd-search-refinement-card-renderer',
    handle: () => {},
  },
  channellink: { selector: '.channel-link', handle: () => {} },
  searchAds: {
    selector: '.ytd-promoted-sparkles-text-search-renderer',
    parents: 2,
    handle: handleAd,
  },
};

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

function cleanCache() {
  leavesCache = {};
  lastObservedSize = 1;
}

var lastCheck: Date;
function refreshUUID() {
  const REFERENCE = 3;
  if (lastCheck && isDate(lastCheck)) {
    var timed = differenceInSeconds(new Date(), lastCheck);
    if (timed > REFERENCE) {
      randomUUID =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15); /*
            console.log(
                "-> It is more than", REFERENCE, timed.asSeconds(),
                "Refreshed randomUUID", randomUUID); */
    } else {
      /*
            console.log("-> It is less then", REFERENCE, timed.asSeconds()); */
    }
  }
  lastCheck = new Date();
}

function flush() {
  window.addEventListener('beforeunload', (e) => {
    hub.event('windowUnload');
  });
}

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.

console.log('hereeeee');

boot({
  payload: {
    config,
    href: window.location.href,
  } as any,
  observe: {
    handlers: watchedPaths,
    onLocationChange,
  },
  onAuthenticated: ytTrexActions,
});
