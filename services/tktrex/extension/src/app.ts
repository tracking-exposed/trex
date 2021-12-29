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

import { Nature } from './models/Nature';

const bo = chrome;

let feedId = ('—' + Math.random() + '-' + _.random(0, 0xff) + '—');
let feedCounter = 0;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot(): void {
  log.debug('booting with config', config);

  // Register all the event handlers.
  // An event handler is a piece of code responsible for a specific task.
  // You can learn more in the [`./handlers`](./handlers/index.html) directory.
  registerHandlers(hub);

  // Lookup the current user and decide what to do.
  localLookup((response) => {
    // `response` contains the user's public key, we save it global for the blinks
    log.debug(JSON.stringify(response));
    // this output is interpreted and read by guardoni

    /* these parameters are loaded from localStorage */
    config.publicKey = response.publicKey;
    config.active = response.active;
    config.ux = response.ux;

    if(!config.active) {
      log.debug('tktrex disabled!');
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
  log.debug('initialize watchers, remoteInfo available:', remoteInfo);

  setupObserver();
  flush();
}

let lastMeaningfulURL: string;
let lastURLNature: Nature | null = null;

function fullSave(): void {
  const urlChanged = (window.location.href !== lastMeaningfulURL);

  if (urlChanged) {
    log.debug('Invoked fullSave: new URL observed');
    // Considering the extension only runs on *.tiktok.com
    // we want to make sure the main code is executed only in
    // website portion actually processed by us. If not, the
    // blink maker would blink in BLUE.
    // This code is executed by a window.setInterval because
    // the location might change
    lastURLNature = getNatureByHref(window.location.href);

    if(!lastURLNature) {
      log.debug('Unsupported URL kind: rejected fullSave');
      return;
    }

    // client might duplicate the sending of the same
    // content, that's 'versionsSent' counter
    // using a random identifier (randomUUID), we spot the
    // clones and drop them server side.
    lastMeaningfulURL = window.location.href;
    refreshUUID();
  }

  const body = document.querySelector('body');

  if (!body) {
    log.debug('No body found, skipping fullSave');
    return;
  }

  log.debug('Sending fullSave!');
  hub.event('newVideo', {
    type: lastURLNature,
    element: body.outerHTML,
    size: body.outerHTML.length,
    href: window.location.href,
    reason: 'fullsave',
    feedId,
  });
}

function refreshUUID(): void {
  feedId = (feedCounter + '—' + Math.random() + '-' + _.random(0, 0xff) );
}

function getNatureByHref(href: string): Nature | null {
  /* this piece of code is duplicated in backend/parsers/nature.js */
  try {
    const urlO = new URL(href);
    const chunks = urlO.pathname.split('/');

    // console.log(urlO.pathname, chunks, chunks.length);
    if(urlO.pathname === '/foryou' || urlO.pathname === '/') {
      return { type: 'foryou' };
    } else if(urlO.pathname === '/following') {
      return { type: 'following' };
    } else if(chunks[2] === 'video' && chunks.length >= 3) {
      return {
        type: 'video',
        authorId: chunks[1],
        videoId: chunks[3],
      };
    } else if(urlO.pathname.startsWith('/@')) {
      return {
        type: 'creator',
        creatorName: urlO.pathname.substring(1),
      };
    } else if(urlO.pathname === '/search') {
      return {
        type: 'search',
        query: urlO.searchParams.get('q') ?? '',
        timestamp: urlO.searchParams.get('t') ?? '',
      };
    } else {
      log.debug('Unmanaged condition from URL:', urlO);
      return null;
    }
  } catch(error) {
    log.error('getNatureByHref:', error);
    return null;
  }
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
  const sugWhat = dom.on(selectors.suggested.selector, handleSuggested);
  const vidWhat = dom.on(selectors.video.selector, handleVideo);
  const creatWhat = dom.on(selectors.creator.selector, handleTest);
  log.debug('Listener installed ',
    JSON.stringify(selectors), sugWhat, vidWhat, creatWhat);

  /* and monitor href changes to randomize a new accessId */
  let oldHref = window.location.href;
  const body = document.querySelector('body');

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (oldHref !== window.location.href) {
        feedCounter++;
        refreshUUID();
        log.debug(oldHref, 'changed to',
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
  log.debug('handleText', element, 'lah lah lah');
  log.debug(element.parentNode.parentNode.parentNode.outerHTML.length);
  log.debug(element.parentNode.parentNode.outerHTML.length);
  log.debug(element.parentNode.outerHTML.length);
  log.debug(element.outerHTML.length);
  */
}

function handleSuggested(elem: Node): void {
  log.debug('handleSuggested', elem, 'should go to parentNode');
  const { parentNode } = elem;
  const parent = parentNode as Element;

  if (!parent || !parent.outerHTML) {
    log.debug('handleSuggested: no parent');
    return;
  }

  hub.event('suggested', {
    html: parent.outerHTML,
    href: window.location.href,
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
          log.debug('handleVideo: parentNode too big',
            memo.parentNode.outerHTML.length);
          return memo;
        }
        return memo.parentNode;
      }

      return memo;
    }, node);

  if(videoRoot.hasAttribute('trex')) {
    log.debug(
      'Element already acquired: skipping',
      videoRoot.getAttribute('trex'),
    );

    return;
  }

  videoCounter++;

  log.debug(
    '+video -- marking as ',
    videoCounter,
    'details:',
    videoRoot,
  );

  videoRoot.setAttribute('trex', `${videoCounter}`);

  hub.event('newVideo', {
    html: videoRoot.outerHTML,
    href: window.location.href,
    feedId,
    feedCounter,
    videoCounter,
    rect: videoRoot.getBoundingClientRect(),
  });

  if(config.ux) {
    videoRoot.style.border = '1px solid green';
  }
}

function flush(): void {
  window.addEventListener('beforeunload', (e) => {
    hub.event('windowUnload', undefined);
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

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.
bo.runtime.sendMessage({type: 'chromeConfig'}, (response) => {
  Object.assign(config, response);
  boot();
});
