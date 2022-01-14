import { map } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import _ from 'lodash';

import config from './config';
import hub from './hub';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import log from './logger';

import { localLookup, serverLookup } from './chrome/background/sendMessage';

import { getNatureByHref } from '@tktrex/lib/nature';

let feedId = '—' + Math.random() + '-' + _.random(0, 0xff) + '—';
let feedCounter = 0;
let lastMeaningfulURL: string;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot(): void {
  log.info('booting with config', config);

  // Register all the event handlers.
  // An event handler is a piece of code responsible for a specific task.
  // You can learn more in the [`./handlers`](./handlers/index.html) directory.
  registerHandlers(hub);

  // Lookup the current user and decide what to do.
  localLookup((settings) => {
    // `response` contains the user's public key, we save it global for the blinks
    log.info('retrieved locally stored user settings', settings);
    // this output is interpreted and read by guardoni

    /* these parameters are loaded from localStorage */
    config.publicKey = settings.publicKey;
    config.active = settings.active;
    config.ux = settings.ux;

    if (!config.active) {
      log.info('tktrex disabled!');
      return null;
    }

    // emergency button should be used when a supported with
    // UX hack in place didn't see any UX change, so they
    // can report the problem and we can handle it.
    initializeEmergencyButton();

    serverLookup(
      {
        feedId,
        href: window.location.href,
      },
      tktrexActions,
    );
  });
}

function tktrexActions(remoteInfo: unknown): void {
  /* these functions are the main activity made in
     content_script, and tktrexActions is a callback
     after remoteLookup */
  log.info('initialize watchers, remoteInfo available:', remoteInfo);

  setupObserver();
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
        refreshUUID();
      }

      const body = document.querySelector('body');

      if (!body) {
        log.error('no body found, skipping fullSave');
        return;
      }

      log.info.strong('sending fullSave!', nature);
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

function refreshUUID(): void {
  feedId = feedCounter + '—' + Math.random() + '-' + _.random(0, 0xff);
}

const selectors = {
  video: {
    selector: 'video',
  },
  suggested: {
    selector: 'div[class$="DivUserContainer"]',
  },
  title: {
    selector: 'h1',
  },
  error: {
    selector: 'h2',
  },
  /* not currently used 'creator' */
  creator: {
    selector: 'a[href^="/@"]',
  },
  search: {
    selector: '[data-e2e="search-card-desc"]',
  },
};

function setupObserver(): void {
  /* this initizalise dom listened by mutation observer */
  dom.on(selectors.suggested.selector, handleSuggested);
  dom.on(selectors.video.selector, handleVideo);
  dom.on(selectors.search.selector, handleSearch);
  dom.on(selectors.error.selector, handleSearch);
  log.info('listeners installed, selectors', selectors);

  /* and monitor href changes to randomize a new accessId */
  let oldHref = window.location.href;
  const body = document.querySelector('body');

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (oldHref !== window.location.href) {
        feedCounter++;
        refreshUUID();
        log.info(
          oldHref,
          'changed to',
          window.location.href,
          'new feedId',
          feedId,
          'feedCounter',
          feedCounter,
          'videoCounter resetting after poking',
          videoCounter,
        );
        videoCounter = 0;
        oldHref = window.location.href;
      }
    });
  });

  const config = {
    childList: true,
    subtree: true,
  };

  if (body) {
    observer.observe(body, config);
  } else {
    log.error('setupObserver: body not found');
  }
}

function handleSearch(element: Node): void {
  if (!_.startsWith(window.location.pathname, '/search')) return;

  // it is lame to do a double check only because they are both searches,
  // but somehow now it is seems the best solution
  const dat = document.querySelectorAll(selectors.search.selector);
  const te = _.map(
    document.querySelectorAll(selectors.error.selector),
    'textContent',
  );
  if (dat.length === 0 && te.indexOf('No results found') === -1) {
    log.debug(
      'Matched invalid h2:',
      te,
      '(which got ignored because they are not errors)',
    );
    return;
  }

  const truel = document.querySelector('body');
  const truehtml = truel ? truel.innerHTML : null;

  if (!truel || !truehtml) return;

  try {
    const monocheck = truel.getAttribute('trex-taken');
    if (monocheck === '1') return;
    truel.setAttribute('trex-taken', '1');
  } catch (error) {
    log.error('Error with attribute tampering, skipping');
    return;
  }

  hub.dispatch({
    type: 'Suggested', // I'm using Suggested only because of TS enforcing
    payload: {
      html: truehtml,
      href: window.location.href,
    },
  });
}

function handleSuggested(elem: Node): void {
  log.info('handleSuggested', elem, 'should go to parentNode');
  const { parentNode } = elem;
  const parent = parentNode as Element;

  if (!parent || !parent.outerHTML) {
    log.info('handleSuggested: no parent');
    return;
  }

  hub.dispatch({
    type: 'Suggested',
    payload: {
      html: parent.outerHTML,
      href: window.location.href,
    },
  });
}

/* function below manages every new video sample
 * that got display in 'following' 'foryou' or 'creator' page */
let videoCounter = 0;

function handleVideo(node: HTMLElement): void {
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
          log.info(
            'handleVideo: parentNode too big',
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
    log.info(
      'element already acquired: skipping',
      videoRoot.getAttribute('trex'),
    );

    return;
  }

  videoCounter++;

  log.info('+video', videoRoot, ' acquired, now', videoCounter, 'in total');

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
}

function flush(): void {
  window.addEventListener('beforeunload', () => {
    hub.dispatch({
      type: 'WindowUnload',
    });
  });
}

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

boot();
