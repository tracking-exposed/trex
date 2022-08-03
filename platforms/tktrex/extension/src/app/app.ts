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

/**
 * Additional UI needed mostly for debugging
function initializeEmergencyButton(): void {
  const element = document.createElement('h1');
  element.onclick = fullSave;
  element.setAttribute('id', 'full--save');
  element.setAttribute(
    'style',
    'position: fixed; top:50%; left: 1rem; display: flex; font-size: 3em; cursor: pointer; flex-direction: column; z-index: 9999; visibility: visible;',
  );
  element.innerText = '💾';
  document.body.appendChild(element);
}

ISSUE #444 explain why of this disabled section.
 */

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

/**
 * Sends the full HTML of the current page to the server.
 * Happens either manually when clicking on the emergency button,
 * and should happen automatically or through a setInterval
 * when the URL of the page changes.

function fullSave(): void {
  const { href } = window.location;
  pipe(
    getNatureByHref(href),
    map((nature) => {
      const urlChanged = href !== lastMeaningfulURL;

      if (urlChanged) {
        lastMeaningfulURL = window.location.href;
        // UUID is used server-side
        // to eliminate potential duplicates
        feedId = refreshUUID(feedCounter);
      }

      const body = document.querySelector('body');

      if (!body) {
        appLog.error('no body found, skipping fullSave');
        return;
      }

      appLog.info('sending fullSave!', nature);
      tkHub.dispatch({
        type: 'FullSave',
        payload: {
          type: nature,
          element: body.outerHTML,
          size: body.outerHTML.length,
          href: window.location.href,
          reason: 'fullsave',
          feedId,
        },
      });
    }),
  );
}
 */

export const onLocationChange = (): void => {
  feedCounter++;
  feedId = refreshUUID(feedCounter);
  appLog.info(
    'new feedId (%s), feed counter incremented (%d) and video counter (maybe) resetted (before was %d) -> %s',
    feedId,
    feedCounter,
    videoCounter,
    window.location.href,
  );

  /* check if the user is switching video, it should go somewhere else but I'm experimenting */
  const match = window.location.pathname.match(
    tkHandlers.nativeVideo.match.location
  );
  console.log(match);
  if(match)
    nativeVideo();
  else
    /* debug in progress, it this case you might not want to reset videoCounter */
    videoCounter = 0;
};

/**
 * handle video when people move with down/uparrow in the feed
 */
 const nativeVideo = () : void => {

  const contentNode = document.querySelector('body');

  /* TODO some more meaningful check */
  tkHub.dispatch({
    type: 'fullScreenVideo',
    payload: {
      html: contentNode.outerHTML,
      href: window.location.href,
      feedId,
      feedCounter,
      videoCounter,
    },
  });
  appLog.info("Reported fullScreenVideo")
}

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
  appLog.info('Handle search for path %O', window.location.search);
  if (!_.startsWith(window.location.pathname, '/search')) return;

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
  appLog.debug('Checking node %O', n);

  if (n.parentNode instanceof HTMLElement) {
    appLog.debug('Parent is a valid node! %O', n.parentNode);
    appLog.debug('previous siblings? %O', n.previousElementSibling);

    if (n.previousElementSibling?.tagName === 'A') {
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
  log.debug('Handle video %O', { node, h, b, config });
  /* we should check nature for good, the 'video' handles are triggered also in
   * other pages, afterall! */
  if (_.startsWith(window.location.pathname, '/search')) return;
  if (profileHandler.match.location.test(window.location.pathname)) return;

  /* this function return a node element that has a size
   * lesser than 10k, and stop when find out the parent
   * would be more than 10k big. */
  const videoRoot = goBackInTree(node);

  if (videoRoot.hasAttribute('trex')) {
    appLog.info(
      'element already acquired: skipping',
      videoRoot.getAttribute('trex'),
    );

    return;
  }

  videoCounter++;

  appLog.info('+video', videoRoot, ' acquired, now', videoCounter, 'in total');

  videoRoot.setAttribute('trex', `${videoCounter}`);

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

  if (config.ux) {
    videoRoot.style.border = '2px solid green';
  }
};

const handleVideoPlaceholder = (
  n: HTMLElement,
  h: any,
  b: any,
  config: UserSettings,
): void => {
  if (n.getAttribute('trex') === '1') {
    appLog.debug('Video placeholder already handled');
    return;
  }

  appLog.debug('Handle video placeholder %O', n);
  const videoRoot = goBackInTree(n);
  appLog.info('Marking as seen placeholder Video (%d) root %O',
    videoCounter, videoRoot);
  n.setAttribute('trex', '1');
  if (config.ux) {
    videoRoot.style.border = '1px solid orange';
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
/**
 * selector with relative handler
 * configuration
 */
export const tkHandlers: { [key: string]: ObserverHandler } = {
  profile: profileHandler,
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
  nativeVideo: {
    match: {
      type: 'route',
      location: /@(\w+)\/video\/(\d+)/i,
    },
    handle: nativeVideo,
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
