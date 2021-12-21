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

// # Code

// Import other utils to handle the DOM and scrape data.
import _ from 'lodash';

import config from './config';
import hub from './hub';
import dom from './dom';
import { registerHandlers } from './handlers/index';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

let feedId = ("—" + Math.random() + "-" + _.random(0, 0xff) + "—");
let feedCounter = 0;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {
  console.log(`tktrex ${JSON.stringify(config)}`);

  // Register all the event handlers.
  // An event handler is a piece of code responsible for a specific task.
  // You can learn more in the [`./handlers`](./handlers/index.html) directory.
  registerHandlers(hub);

  // Lookup the current user and decide what to do.
  localLookup(response => {
    // `response` contains the user's public key, we save it global for the blinks
    console.log(JSON.stringify(response));
    // this output is interpreted and read by guardoni

    /* these parameters are loaded from localstorage */
    config.publicKey = response.publicKey;
    config.active = response.active;
    config.ux = response.ux;

    if(config.active !== true) {
      console.log("tktrex disabled!");
      return null;
    }

    // emergency button should be used when a supported with
    // UX hack in place didn't see any UX change, so they
    // can report the problem and we can handle it.
    initializeEmergencyButton();
    return remoteLookup(tktrexActions);
  });
}

function tktrexActions(remoteInfo) {
  /* these functions are the main activity made in
     content_script, and tktrexActions is a callback
     after remoteLookup */
  console.log("initialize watchers, remoteInfo available:", remoteInfo);

  setupObserver();
  flush();
}

let lastMeaningfulURL, urlkind = null;
function fullSave() {
  let diff = (window.location.href !== lastMeaningfulURL);

  if (diff) {
    console.log("Invoked fullSave: new URL observed");
    // Considering the extension only runs on *.youtube.com
    // we want to make sure the main code is executed only in
    // website portion actually processed by us. If not, the
    // blink maker would blink in BLUE.
    // This code is executed by a window.setInterval because
    // the location might change
    urlkind = getNatureByHref(window.location.href);

    if(!urlkind) {
      console.log("Unsupported URL type: rejected fullsave");
      return null;
    }

    // client might duplicate the sending of the same
    // content, that's 'versionsSent' counter
    // using a random identifier (randomUUID), we spot the
    // clones and drop them server side.
    lastMeaningfulURL = window.location.href;
    refreshUUID();
  }

  const sendableNode = document.querySelector('body');
  console.log("Sending fullSave!");
  hub.event('newVideo', {
    type: urlkind,
    element: sendableNode.outerHTML,
    size: sendableNode.outerHTML.length,
    href: window.location.href,
    reason: 'fullsave',
    feedId,
  });
}                                    

function refreshUUID() {
  feedId = (feedCounter + "—" + Math.random() + "-" + _.random(0, 0xff) );
}

function getNatureByHref(href) {
  /* this piece of code is duplicated in backend/parsers/nature.js */
  try {
    const urlO = new URL(href);
    const chunks = urlO.pathname.split('/');
    const retval = {};

    // console.log(urlO.pathname, chunks, chunks.length);
    if(urlO.pathname === "/foryou") {
      retval.type = 'foryou'
    } else if(urlO.pathname === "/") {
      retval.type = 'foryou';
    } else if(urlO.pathname === "/following") {
      retval.type = 'following';
    } else if(chunks[2] === 'video' && chunks.length >= 3) {
      retval.type = 'video';
      retval.videoId = chunks[3];
      retval.authorId = chunks[1];
    } else if(_.startsWith(urlO.pathname, "/@")) {
      retval.type = 'creator';
      retval.creatorName = urlO.pathname.substr(1);
    } else if(urlO.pathname === "/search") {
      retval.type = 'search';
      retval.query = urlO.searchParams.get('q');
      retval.timestamp = urlO.searchParams.get('t');
    } else {
      console.log("Unmanaged condition from URL:", urlO)
      return null;
    }
    console.log("getNatureByHref attributed", JSON.stringify(retval));
    return retval;
  } catch(error) {
    console.log("getNatureByHref:", error.message);
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
  }
};

function setupObserver() {
  /* this initizalise dom listened by mutation observer */
  const sugwat = dom.on(selectors.suggested.selector, handleSuggested);
  const vidwat = dom.on(selectors.video.selector, handleVideo);
  const creatwat = dom.on(selectors.creator.selector, handleTest);
  console.log("Listener installed ",
    JSON.stringify(selectors), sugwat, vidwat, creatwat);

  /* and monitor href changes to randomize a new accessId */
  let oldHref = window.location.href;
  const bodyList = document.querySelector("body");
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (oldHref != window.location.href) {
        feedCounter++;
        refreshUUID();
        console.log(oldHref, "changed to",
          window.location.href, "new feedId", feedId, 
          "feedCounter", feedCounter,
          "videoCounter resetting after poking", videoCounter);
        videoCounter = 0;
        oldHref = window.location.href;
      }
    });
  });
  var config = {
    childList: true,
    subtree: true
  };
  observer.observe(bodyList, config);
}

function handleTest(element) {
  console.log("handleText", element, "lah lah lah");
  console.log(element.parentNode.parentNode.parentNode.outerHTML.length);
  console.log(element.parentNode.parentNode.outerHTML.length);
  console.log(element.parentNode.outerHTML.length);
  console.log(element.outerHTML.length);
}

function handleSuggested(elem) {
  console.log("handleSuggested", elem, "should go to parentNode");
  hub.event('suggested', {
    html: elem.parentNode.outerHTML,
    href: window.location.href,
  });
}

/* function below manages every new video sample  
 * that got display in 'following' 'foryou' or 'creator' page */
const SPECIAL_DEBUG = false;
let videoCounter = 0;
function handleVideo(elem) {

  /* this function return a node element that has a size
   * lesser than 10k, and stop when find out the parent
   * would be more than 10k big. */
  const refe = _.reduce(_.times(20),
    function(memo, iteration) {
      const check = memo.parentNode ?
        memo.parentNode.outerHTML.length : 0;
      if(check < 10000 && SPECIAL_DEBUG)
        console.log(videoCounter, iteration, check);
      return (check > 10000) ? memo : memo.parentNode;
    }, elem);

  if(refe.hasAttribute('trex')) {
    console.log("Element already acquired: skipping",
      refe.getAttribute('trex'));
    return null;
  }

  videoCounter++;
  console.log("+video -- marking as ", videoCounter, "details:", refe);
  refe.setAttribute('trex', videoCounter);

  hub.event('newVideo', {
    html: refe.outerHTML,
    href: window.location.href,
    feedId,
    feedCounter,
    videoCounter,
    rect: refe.getBoundingClientRect(),
  });

  if(config.ux)
    refe.style.border = '1px solid green';
}

// The function `localLookup` communicates with the **action pages**
// to get information about the current user from the browser storage
// (the browser storage is unreachable from a **content script**).
function localLookup (callback) {
  bo.runtime.sendMessage({
    type: 'localLookup',
    payload: {
      userId: 'local' // at the moment is fixed to 'local'
    }
  }, callback);
}

// The function `remoteLookup` communicate the intention
// to the server of performing a certain test, and retrive
// updated parsers
function remoteLookup (callback) {
  bo.runtime.sendMessage({
    type: 'remoteLookup',
    payload: {
      feedId,
      href: window.location.href,
    }
  }, callback);
}

function flush () {
  window.addEventListener('beforeunload', (e) => {
    hub.event('windowUnload');
  });
}

function initializeEmergencyButton() {
  // const expectedSVG = $('[role="banner"] svg');
  const element = document.createElement('h1');
  element.onclick = fullSave;
  element.setAttribute('id', "full--save");
  element.style = "position: fixed; top:50%; left: 1rem; display: flex; font-size: 3em; cursor: pointer; flex-direction: column; z-index: 9999; visibility: visible;"
  element.innerText = "💾";
  document.body.appendChild(element);  
}

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.
bo.runtime.sendMessage({type: 'chromeConfig'}, (response) => {
  Object.assign(config, response);
  boot();
});
