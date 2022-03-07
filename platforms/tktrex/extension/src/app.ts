import { boot, refreshUUID } from '@shared/extension/app';
import config from '@shared/extension/config';
import hub from '@shared/extension/hub';
import log from '@shared/extension/logger';
import { sizeCheck } from '@shared/providers/dataDonation.provider';
import { getNatureByHref } from '@tktrex/lib/nature';
import { map } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import _ from 'lodash';
import { INTERCEPTED_ITEM_CLASS } from './interceptor/constants';

const appLog = log.extend('app');

let feedId = '—' + Math.random() + '-' + _.random(0, 0xff) + '—';
let feedCounter = 0;
let lastMeaningfulURL: string;

/**
 * Additional UI needed mostly for debugging
 */
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

function tktrexActions(remoteInfo: unknown): void {
  /* these functions are the main activity made in
     content_script, and tktrexActions is a callback
     after remoteLookup */
  appLog.info('initialize watchers, remoteInfo available:', remoteInfo);

  // initialize ui
  initializeEmergencyButton();

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
 */
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
      hub.dispatch({
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

/**
 * handle a new intercepted datum node by dispatching
 * the event to the hub and remove the node from the container
 */

const handleInterceptedData = (): void => {
  const itemNodes = document.body.querySelectorAll(
    tkHandlers.apiInterceptor.selector,
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
      hub.dispatch({
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
  console.log('Sigi', element);
});

const handleSearch = _.debounce((element: Node): void => {
  appLog.info('Handle search for path %O', window.location.search);
  if (!_.startsWith(window.location.pathname, '/search')) return;

  // it is lame to do a double check only because they are both searches,
  // but somehow now it is seems the best solution
  const dat = document.querySelectorAll(tkHandlers.search.selector);
  const te = _.map(
    document.querySelectorAll(tkHandlers.error.selector),
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

  hub.dispatch({
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

  hub.dispatch({
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

const handleVideo = _.debounce((node: HTMLElement): void => {
  /* this is not the right approach, but we shouldn't save
     video when we're in search or tag condition
   -- I would have
     used getNatureByHref(window.location.href) but I couldn't
     manage the TS */
  if (_.startsWith(window.location.pathname, '/search')) return;

  /* this function return a node element that has a size
   * lesser than 10k, and stop when find out the parent
   * would be more than 10k big. */
  const videoRoot = _.reduce(
    _.times(20),
    (memo: HTMLElement, iteration: number): HTMLElement => {
      if (memo.parentNode instanceof HTMLElement) {
        if (memo.parentNode.outerHTML.length > 10000) {
          appLog.debug(
            'handleVideo: parentNode > 10000',
            memo.parentNode.outerHTML.length,
          );
          return memo;
        }
        return memo.parentNode;
      }

      return memo;
    },
    node,
  );

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

  hub.dispatch({
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
    videoRoot.style.border = '1px solid green';
  }
}, 300);

function flush(): void {
  window.addEventListener('beforeunload', () => {
    hub.dispatch({
      type: 'WindowUnload',
    });
  });
}

/**
 * selector with relative handler
 * configuration
 */
const tkHandlers = {
  video: {
    selector: 'video',
    handle: handleVideo,
  },
  suggested: {
    selector: 'div[class$="DivUserContainer"]',
    handle: handleSuggested,
  },
  title: {
    selector: 'h1',
    handle: () => undefined,
  },
  error: {
    selector: 'h2',
    handle: handleSearch,
  },
  /* not currently used 'creator' */
  creator: {
    selector: 'a[href^="/@"]',
    handle: () => undefined,
  },
  search: {
    selector: '[data-e2e="search-card-desc"]',
    handle: handleSearch,
  },
  apiInterceptor: {
    selector: `div.${INTERCEPTED_ITEM_CLASS}`,
    handle: handleInterceptedData,
  },
  sigiExperiment: {
    selector: '#sigi-persisted-data',
    handle: handleSigi,
  },
};

// Boot the app script. This is the first function called.
boot({
  payload: {
    feedId,
    href: window.location.href,
  },
  observe: {
    handlers: tkHandlers,
    onLocationChange: () => {
      feedCounter++;
      feedId = refreshUUID(feedCounter);
      appLog.info(
        'new feedId (%s), feed counter (%d) and video counter resetting after poking (%d)',
        feedId,
        feedCounter,
        videoCounter,
      );
      videoCounter = 0;
    },
  },
  onAuthenticated: tktrexActions,
});
