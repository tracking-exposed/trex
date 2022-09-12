import {
  ObserverHandler,
  refreshUUID,
  RouteObserverHandler,
  SelectorObserverHandler,
} from '@shared/extension/app';
import log from '@shared/extension/logger';
import UserSettings from '@shared/extension/models/UserSettings';
import { sizeCheck } from '@shared/providers/dataDonation.provider';
import _ from 'lodash';
import tkHub from '../handlers/hub';
import { INTERCEPTED_ITEM_CLASS } from '../interceptor/constants';

export const appLog = log.extend('app');

export let feedId = refreshUUID(0);
export let feedCounter = 0;

export function tkTrexActions(remoteInfo: unknown): void {
  /* these functions are the main activity made in
     content_script, and tktrexActions is a callback
     after remoteLookup */
  appLog.info('initialize watchers, remoteInfo available:', remoteInfo);

  // initialize ui
  // initializeEmergencyButton();

  // the mutation observer seems to ignore container new children,
  // so an interval take place here
  setInterval(
    () => _.debounce(handleInterceptedData, 5000, { trailing: true }),
    5000,
  );
  flush();
}

export const onLocationChange = (oldHref: string, newHref: string): void => {
  /* in tiktok we should not refresh this if there is a sequence of
   * native video, because this might means the user is scrolling one
   * by one, so, if both the location are native videos, return , so
   * the timeline and the video counter keep incrementing. But this
   * function should be called anyway, so in this way the extension can
   * keep behaving like a new URL has happened, which is the case */

  if (
    oldHref?.match(nativeRouteHandler.match.location) &&
    newHref.match(nativeRouteHandler.match.location)
  ) {
    appLog.info('Native video in sequence, suppressed refresh.');
    return;
  }

  feedId = refreshUUID(feedCounter);
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

const handleInterceptedData = (): void => {
  const itemNodes = document.body.querySelectorAll(
    (tkHandlers.apiInterceptor.match as any).selector,
  );

  if (itemNodes.length === 0) {
    return;
  }

  appLog.debug('Intercepted %d items', itemNodes.length);

  itemNodes.forEach((ch, i) => {
    // hidLog.info('Child el %O', childEl);
    const html = ch.innerHTML;
    try {
      const data = JSON.parse(html);
      tkHub.dispatch({
        type: 'APIEvent',
        payload: data,
      });
    } catch (e) {
      appLog.error('Error %O', e);
    }
    appLog.debug('Remove child from container: O%', ch);

    ch.remove();
  });
};

// experiment in progress;
const handleSigi = _.debounce((element: Node): void => {
  // eslint-disable-next-line no-console
  console.log('Sigi', element);
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
  const contentHTML = contentNode ? contentNode.innerHTML : null;
  if (!contentNode || !contentHTML) return;

  const hasNewElements = sizeCheck(contentNode.innerHTML);
  if (!hasNewElements) return;

  tkHub.dispatch({
    type: 'Search',
    payload: {
      html: contentHTML,
      href: window.location.href,
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
    selector: '[data-e2e="search-card-desc"]',
  },
  handle: handleSearch,
};

export const errorHandler: SelectorObserverHandler = {
  match: {
    type: 'selector',
    selector: 'h2',
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
    },
    handle: handleVideo,
  },
  videoPlaceholder: {
    match: {
      type: 'selector',
      selector: 'canvas[class*="CanvasVideoCardPlaceholder"]',
    },
    handle: handleVideoPlaceholder,
  },
  suggested: {
    match: {
      type: 'selector',
      selector: 'div[class$="DivUserContainer"]',
    },
    handle: handleSuggested,
  },
  title: {
    match: {
      type: 'selector',
      selector: 'h1',
    },
    handle: () => undefined,
  },
  error: errorHandler,
  /* not currently used 'creator' */
  creator: {
    match: {
      type: 'selector',
      selector: 'a[href^="/@"]',
    },
    handle: () => undefined,
  },
  search: searchHandler,
  apiInterceptor: {
    match: {
      type: 'selector',
      selector: `div.${INTERCEPTED_ITEM_CLASS}`,
    },
    handle: handleInterceptedData,
  },
  sigiExperiment: {
    match: {
      type: 'selector',
      selector: '#sigi-persisted-data',
    },
    handle: handleSigi,
  },
};
