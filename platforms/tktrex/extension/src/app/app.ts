import {
  ObserverHandler,
  refreshUUID,
  RouteObserverHandler,
  SelectorObserverHandler,
} from '@shared/extension/app';
import log from '@shared/extension/logger';
import UserSettings from '@shared/extension/models/UserSettings';
import { HTMLSize } from '@shared/extension/utils/HTMLSize.utils';
import _ from 'lodash';
import tkHub from './hub';
import { INTERCEPTOR_CONTAINER_ID } from '../interceptor/constants';
import { addAppUI } from './components';

export const appLog = log.extend('app');
const searchSize = HTMLSize();

export let feedId = refreshUUID(0);
export let feedCounter = 0;

export function tkTrexActions(remoteInfo: unknown): void {
  /* these functions are the main activity made in
     content_script, and tktrexActions is a callback
     after remoteLookup */
  appLog.info('initialize watchers, remoteInfo available:', remoteInfo);

  // initialize ui

  const apiInterceptorUI = document.createElement('div');
  addAppUI(apiInterceptorUI);

  // initializeEmergencyButton();

  // the mutation observer seems to ignore container new children,
  // so an interval take place here
  // setInterval(
  //   () => _.debounce(handleInterceptedData, 5000, { trailing: true }),
  //   5000
  // );

  flush();
}

const feedIdNeedsRefresh = (oldHref: string, newHref: string): boolean => {
  const newPathname = new URL(newHref).pathname;
  const isNewHrefForYou =
    newPathname.match(forYouRouteHandler.match.location) ?? newPathname === '/';
  // at the first call of this function oldHref is undefined,
  // so we check if the newHref is "/"
  if (!oldHref) {
    if (newPathname === '/' || isNewHrefForYou) {
      return false;
    }
    return true;
  }

  const oldPathname = new URL(oldHref).pathname;

  const isOldHrefForYou =
    oldPathname.match(forYouRouteHandler.match.location) ?? oldPathname === '/';

  // prevent feedId refresh when navigate from '/' to '/foryou' and viceversa
  if (isOldHrefForYou) {
    if (isNewHrefForYou) {
      return false;
    }
  }

  const isOldHrefNative = oldPathname.match(nativeRouteHandler.match.location);
  const isNewHrefNative = newPathname.match(nativeRouteHandler.match.location);

  appLog.debug('New href match native? %b', isOldHrefNative);
  if (isNewHrefNative) {
    appLog.debug('Old href match native? %b', isOldHrefNative);
    if (isOldHrefNative) {
      return false;
    }

    appLog.debug('Old href match foryou? %b', isOldHrefNative);

    if (isOldHrefForYou) {
      return false;
    }
  }

  return true;
};

export const onLocationChange = (oldHref: string, newHref: string): void => {
  /* in tiktok we should not refresh this if there is a sequence of
   * native video, because this might means the user is scrolling one
   * by one, so, if both the location are native videos, return , so
   * the timeline and the video counter keep incrementing. But this
   * function should be called anyway, so in this way the extension can
   * keep behaving like a new URL has happened, which is the case */

  const refreshFeedId = feedIdNeedsRefresh(oldHref, newHref);
  appLog.debug(
    'Check feedId needs refresh %s => %s?',
    oldHref,
    newHref,
    refreshFeedId,
  );

  if (!refreshFeedId) {
    appLog.info('Native video in sequence, suppressed refresh.');
    return;
  }

  feedId = refreshUUID(feedCounter);
  videoCounter = 0;
  feedCounter = 0;
  appLog.info('new feedId (%s) for url %s', feedId, window.location.href);
};

/**
 * handle video when people move with down/uparrow in the feed
 */
const handleVideoRoute = (
  dom: HTMLElement,
  handler: any,
  routeKey: string,
  config: UserSettings,
): void => {
  if (!dom) return;

  feedCounter++;
  videoCounter++;

  appLog.debug('+native acquired, total %d', videoCounter);

  /* TODO some more meaningful check */
  tkHub.dispatch({
    type: 'NativeVideo',
    payload: {
      html: dom.outerHTML,
      href: window.location.href,
      feedId,
      feedCounter,
      videoCounter,
    },
  });

  if (config.ux) {
    // add proper UI feedback
  }
};

/**
 * handle a new intercepted datum node by dispatching
 * the event to the hub and remove the node from the container
 */

const handleInterceptedData = (element: Node): void => {
  const itemNodes = Array.from(element.childNodes);

  appLog.info('Intercepted data %d', itemNodes.length);
  if (itemNodes.length === 0) {
    appLog.debug('No intercepted requests, skipping...');
    return;
  }

  appLog.debug('Intercepted %d items', itemNodes.length);

  itemNodes.forEach((ch, i) => {
    const payload = ch.textContent ?? 'not-parsable';
    const json = JSON.parse(payload);
    if (json.url === '/v1/list') {
      appLog.info(
        'Request intercepted %O',
        (json.events ?? []).map((e: any) => e.event),
      );
    }

    try {
      tkHub.dispatch({
        type: 'APIRequestEvent',
        payload: {
          payload,
          feedId,
          feedCounter,
          href: window.location.href,
        },
      });
    } catch (e) {
      appLog.error('Error %O', e);
    }
    appLog.debug('Remove child from container: O%', ch);

    ch.remove();
  });
};

let lastHandleSigi: any;
// experiment in progress;
const handleSigi = _.debounce((element: Node): void => {
  // eslint-disable-next-line no-console
  const script = element.textContent;
  if (!script) {
    log.error('No SIGI_STATE found');
    return;
  }

  const data = JSON.parse(script);
  if (JSON.stringify(data) === JSON.stringify(lastHandleSigi)) {
    log.info('Sigi has not changed, skipping update...');
    return;
  }

  log.info('Sigi state %O', data);

  tkHub.dispatch({
    type: 'SigiState',
    payload: {
      state: JSON.stringify(data),
      href: window.location.href,
      feedId,
      feedCounter,
    },
  });
  lastHandleSigi = data;
});

const handleSearch = _.debounce((element: Node): void => {
  if (!_.startsWith(window.location.pathname, '/search')) return;

  appLog.info('Handle search for path %O', window.location.search);

  // This double check it is due because the Search might
  // return an error and in both of the cases they should be
  // considered a result.
  // This is a logic problem in this extension, we should
  // use URL or selector to trigger the right function.
  const dat = document.querySelectorAll(searchHandler.match.selector);
  const te = _.map(
    document.querySelectorAll(errorHandler.match.selector),
    'textContent',
  );
  if (dat.length === 0 && !te.includes('No results found')) {
    appLog.debug(
      'Matched invalid h2:',
      te,
      '(which got ignored because they are not errors)',
    );
    return;
  }

  const contentNode = document.querySelector('body');
  const contentHTML = contentNode?.innerHTML;
  if (!contentHTML) return;

  const hasNewElements = searchSize.check(contentHTML);
  if (!hasNewElements) return;

  tkHub.dispatch({
    type: 'Search',
    payload: {
      html: contentHTML,
      href: window.location.href,
      feedId,
    },
  });
}, 300);

const handleSuggested = _.debounce((elem: Node): void => {
  appLog.info('handleSuggested', elem, 'should go to parentNode');
  const { parentNode } = elem;
  const parent = parentNode as Element;

  if (!parent || !parent.outerHTML) {
    appLog.info('handleSuggested: no parent');
    return;
  }

  tkHub.dispatch({
    type: 'Suggested',
    payload: {
      html: parent.outerHTML,
      href: window.location.href,
      feedId,
    },
  });
}, 300);

/* function below manages every new video sample
 * that got display in 'following' 'foryou' or 'creator' page */
let videoCounter = 0;

const goBackInTree = (n: HTMLElement): HTMLElement => {
  // appLog.debug('Checking node %O', n);

  if (n.parentNode instanceof HTMLElement) {
    // appLog.debug('Parent is a valid node! %O', n.parentNode);
    // appLog.debug('previous siblings? %O', n.previousElementSibling);

    if (n.previousElementSibling?.tagName === 'A') {
      appLog.debug('Found node with previous sibling = A');
      return n.parentNode;
    }

    if (n.parentNode.outerHTML.length > 10000) {
      appLog.debug(
        'goBackInTree: parentNode > 10000',
        n.parentNode.outerHTML.length,
      );

      return n;
    }

    return goBackInTree(n.parentNode);
  }

  return n;
};

/**
 * Handle video
 *
 * @param node the video matching the selector
 */
const handleVideo = (
  node: HTMLElement,
  h: any,
  b: any,
  config: UserSettings,
): void => {
  if (_.startsWith(window.location.pathname, '/search')) return;
  if (profileHandler.match.location.test(window.location.pathname)) return;
  if (nativeRouteHandler.match.location.test(window.location.pathname)) return;

  appLog.debug('handleVideo %O', { node, h, b, config });

  /* this function return a node element that has a size
   * lesser than 10k, and stop when find out the parent
   * would be more than 10k big. */
  const videoRoot = goBackInTree(node);

  if (videoRoot.hasAttribute('trex-video')) {
    appLog.debug(
      'element already acquired: skipping',
      videoRoot.getAttribute('trex-video'),
    );

    return;
  }

  feedCounter++;
  videoCounter++;

  appLog.info('+video', videoRoot, ' acquired, now', videoCounter, 'in total');

  videoRoot.setAttribute('trex-video', `${videoCounter}`);

  if (config.ux) {
    videoRoot.style.border = '2px solid green';
  } else {
    videoRoot.style.border = '';
  }

  tkHub.dispatch({
    type: 'NewVideo',
    payload: {
      html: videoRoot.outerHTML,
      href: window.location.href,
      feedId,
      feedCounter,
      videoCounter,
      rect: videoRoot.getBoundingClientRect(),
    },
  });
};

const handleVideoPlaceholder = (
  n: HTMLElement,
  h: any,
  b: any,
  config: UserSettings,
): void => {
  if (n.getAttribute('trex-placeholder') === '1') {
    // appLog.debug('Video placeholder already handled');
    // commented because way too much verbose
    return;
  }

  appLog.debug('Handle video placeholder %O', n);
  const videoRoot = goBackInTree(n);
  appLog.info(
    'Marking as seen placeholder Video (%d) root %O',
    videoCounter,
    videoRoot,
  );
  n.setAttribute('trex-placeholder', '1');

  if (config.ux) {
    n.style.border = '1px solid orange';
  } else {
    n.style.border = '';
  }
};

const handleProfile = _.debounce(
  (
    node: HTMLElement,
    route: any,
    _selectorName: string,
    s: UserSettings,
  ): void => {
    const profileName = window.location.pathname.match(
      route.match.location,
    )?.[1];

    if (!profileName) {
      appLog.info('Error in getting profile name %s', window.location.pathname);
      return;
    }
    appLog.info('Spotted profile %s', profileName);
    /* this condition is managed here because when a 'profile' is loaded
     * in the href, and the event location change starts, we don't have
     * yet an html. but, also with profile
     * */
    appLog.info('Handling this video as a profile');
    const contentNode = document.querySelector('body');
    const contentHTML = contentNode ? contentNode.innerHTML : null;
    if (!contentNode || !contentHTML) {
      appLog.info('Spotted profile but body still empty?');
      return;
    }

    tkHub.dispatch({
      type: 'Profile',
      payload: {
        html: contentHTML,
        href: window.location.href,
        feedId,
        feedCounter,
        videoCounter,
      },
    });
  },
  300,
);

function flush(): void {
  window.addEventListener('beforeunload', () => {
    tkHub.dispatch({
      type: 'WindowUnload',
    });
  });
}

export const searchHandler: SelectorObserverHandler = {
  match: {
    type: 'selector',
    observe: true,
    selector: '[data-e2e="search-card-desc"]',
  },
  handle: handleSearch,
};

export const errorHandler: SelectorObserverHandler = {
  match: {
    type: 'selector',
    selector: 'h2',
    observe: true,
  },
  handle: handleSearch,
};

export const profileHandler: RouteObserverHandler = {
  match: {
    type: 'route',
    location: /@([\w\-._]*)$/i,
  },
  handle: handleProfile,
};

export const nativeRouteHandler: RouteObserverHandler = {
  match: {
    type: 'route',
    location: /^\/@([a-zA-Z._0-9]+)\/video\/(\d+)/i,
  },
  handle: handleVideoRoute,
};

export const forYouRouteHandler: RouteObserverHandler = {
  match: {
    type: 'route',
    location: /^\/foryou/i,
  },
  handle: () => {},
};

/**
 * selector with relative handler
 * configuration
 */
export const tkHandlers: { [key: string]: ObserverHandler } = {
  profile: profileHandler,
  nativeVideo: nativeRouteHandler,
  video: {
    match: {
      type: 'selector',
      selector: 'video',
      observe: true,
    },
    handle: handleVideo,
  },
  videoPlaceholder: {
    match: {
      type: 'selector',
      selector: 'canvas[class*="CanvasVideoCardPlaceholder"]',
      observe: true,
    },
    handle: handleVideoPlaceholder,
  },
  suggested: {
    match: {
      type: 'selector',
      selector: 'div[class$="DivUserContainer"]',
      observe: true,
    },
    handle: handleSuggested,
  },
  title: {
    match: {
      type: 'selector',
      selector: 'h1',
      observe: true,
    },
    handle: () => undefined,
  },
  error: errorHandler,
  /* not currently used 'creator' */
  creator: {
    match: {
      type: 'selector',
      selector: 'a[href^="/@"]',
      observe: true,
    },
    handle: () => undefined,
  },
  search: searchHandler,
  /**
   * Handle the intercepted API requests sent to tiktok.com.
   *
   * It uses the {@link TrExXMLHttpPRequest} to intercept requests.
   */
  apiInterceptor: {
    match: {
      type: 'selector',
      observe: true,
      selector: `#${INTERCEPTOR_CONTAINER_ID}`,
    },
    handle: handleInterceptedData,
  },
  /**
   * Handle the SIGI_STATE returned in the html body
   * on first render
   */
  sigiExperiment: {
    match: {
      type: 'selector',
      observe: true,
      selector: '#SIGI_STATE',
    },
    handle: handleSigi,
  },
};
