import _ from 'lodash';

import config from './config';
import hub from './hub';
import * as dom from './dom';
import { registerHandlers } from './handlers/index';
import log from './logger';

import {
  localLookup,
  serverLookup,
} from './chrome/background/sendMessage';

import { Nature } from '@tktrex/models/Nature';
import { getNatureByHref } from '@tktrex/lib/nature';

let feedId = ('—' + Math.random() + '-' + _.random(0, 0xff) + '—');
let feedCounter = 0;

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

    serverLookup({
      feedId,
      href: window.location.href,
    }, tktrexActions);
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

let lastMeaningfulURL: string;
let lastURLNature: Nature;

function fullSave(): void {
  const { href } = window.location;
  const urlChanged = (href !== lastMeaningfulURL);

  if (urlChanged) {
    log.info('fullSave invoked because new URL observed');
    // Considering the extension only runs on *.tiktok.com
    // we want to make sure the main code is executed only in
    // website portion actually processed by us. If not, the
    // blink maker would blink in BLUE.
    // This code is executed by a window.setInterval because
    // the location might change
    const maybeNature = getNatureByHref(window.location.href);

    if (maybeNature instanceof Error) {
      log.error('error trying to figure out the nature from the URL', href);
      return;
    }

    // client might duplicate the sending of the same
    // content, that's 'versionsSent' counter
    // using a random identifier (randomUUID), we spot the
    // clones and drop them server side.
    lastMeaningfulURL = window.location.href;
    lastURLNature = maybeNature;
    refreshUUID();
  }

  const body = document.querySelector('body');

  if (!body) {
    log.error('no body found, skipping fullSave');
    return;
  }

  log.info.strong('sending fullSave!');
  hub.dispatch({
    type: 'FullSave',
    payload: {
      type: lastURLNature,
      element: body.outerHTML,
      size: body.outerHTML.length,
      href: window.location.href,
      reason: 'fullsave',
      feedId,
    },
  });
}

function refreshUUID(): void {
  feedId = (feedCounter + '—' + Math.random() + '-' + _.random(0, 0xff) );
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
  creator: {
    selector: 'a[href^="/@"]',
  },
};

function setupObserver(): void {
  /* this initizalise dom listened by mutation observer */
  dom.on(selectors.suggested.selector, handleSuggested);
  dom.on(selectors.video.selector, handleVideo);
  dom.on(selectors.creator.selector, handleTest);
  log.info('listeners installed, selectors', selectors);

  /* and monitor href changes to randomize a new accessId */
  let oldHref = window.location.href;
  const body = document.querySelector('body');

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (oldHref !== window.location.href) {
        feedCounter++;
        refreshUUID();
        log.info(oldHref, 'changed to',
          window.location.href, 'new feedId', feedId,
          'feedCounter', feedCounter,
          'videoCounter resetting after poking', videoCounter);
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

function handleTest(element: Node): void {
  /*
  log.info('handleText', element, 'lah lah lah');
  log.info(element.parentNode.parentNode.parentNode.outerHTML.length);
  log.info(element.parentNode.parentNode.outerHTML.length);
  log.info(element.parentNode.outerHTML.length);
  log.info(element.outerHTML.length);
  */
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
  /* this function return a node element that has a size
   * lesser than 10k, and stop when find out the parent
   * would be more than 10k big. */
  const videoRoot = _.reduce(_.times(20),
    (memo: HTMLElement, iteration: number): HTMLElement => {
      if (memo.parentNode instanceof HTMLElement) {
        if (memo.parentNode.outerHTML.length > 10000) {
          log.info('handleVideo: parentNode too big',
            memo.parentNode.outerHTML.length);
          return memo;
        }
        return memo.parentNode;
      }

      return memo;
    }, node);

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
