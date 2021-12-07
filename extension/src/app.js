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
import _ from 'lodash';
import moment from 'moment';

import config from './config';
import hub from './hub';
import { registerHandlers } from './handlers/index';
import extractor from './extractor';
import dom from './dom';
import { phase, initializeBlinks } from './blink';
import consideredURLs from './consideredURLs';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// variable used to spot differences due to refresh and url change
let randomUUID = 'INIT' + Math.random().toString(36).substring(2, 13) +
                Math.random().toString(36).substring(2, 13);

// to optimize the amount of reported data, we used a local cache
let lastObservedSize = 1;
let leavesCache = {};

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {

    // this get executed only on youtube.com
    console.log(`yttrex version ${JSON.stringify(config)}`);

    // Register all the event handlers.
    // An event handler is a piece of code responsible for a specific task.
    // You can learn more in the [`./handlers`](./handlers/index.html) directory.
    registerHandlers(hub);

    // Lookup the current user and decide what to do.
    localLookup(response => {
        // `response` contains the user's public key, and this format is 
        console.log(JSON.stringify(response));
        // SHOULD NOT CHANGE because Guardoni parse it.

        /* these parameters are loaded from localstorage */
        config.publicKey = response.publicKey;
        config.active = response.active;
        config.ux = response.ux;

        if(config.active !== true) {
            console.log("ytTREX disabled!"); // TODO some UX change
            return null;
        }
        return remoteLookup(ytTrexActions);
    });
}

const hrefPERIODICmsCHECK = 2000;
let hrefWatcher = null;
function ytTrexActions(remoteInfo) {
    /* these functions are the main activity made in 
       content_script, and ytTrexActions is a callback
       after remoteLookup */
    console.log("initialize watchers, remoteInfo available:", remoteInfo);

    if(hrefWatcher)
        clearInterval(hrefWatcher);

    hrefWatcher = window.setInterval(hrefAndPageWatcher, hrefPERIODICmsCHECK);
    initializeBlinks();
    leavesWatcher();
    flush();
}

function processableURL(validURLs, location) {
    return _.reduce(validURLs, function(memo, matcher, name) {
        if(memo)
            return memo;

        if(location.pathname.match(matcher))
            memo = name;

        return memo;
    }, null)
}

let lastMeaningfulURL, urlkind = null;
function hrefAndPageWatcher () {

    let diff = (window.location.href !== lastMeaningfulURL);

    if (diff) {
        // Considering the extension only runs on *.youtube.com
        // we want to make sure the main code is executed only in
        // website portion actually processed by us. If not, the
        // blink maker would blink in BLUE.
        // This code is executed by a window.setInterval because 
        // the location might change 
        urlkind = processableURL(consideredURLs, window.location);

        if(!urlkind) {
            phase('video.wait');
            return null;
        }

        // client might duplicate the sending of the same
        // content, that's 'versionsSent' counter
        // using a random identifier (randomUUID), we spot the
        // clones and drop them server side.
        // also, here is cleaned the cache declared below
        phase('video.seen');
        lastMeaningfulURL = window.location.href;
        cleanCache();
        refreshUUID();
    }

    const sendableNode = document.querySelector('ytd-app');

    if (!sizeCheck(sendableNode.outerHTML))
        return;

    hub.event('newVideo', {
        type: urlkind,
        element: sendableNode.outerHTML,
        size: sendableNode.outerHTML.length,
        href: window.location.href,
        randomUUID
    });
    phase('video.send');
}

function sizeCheck(nodeHTML) {
    // this function look at the LENGTH of the proposed element.
    // this is used in video because the full html body page would be too big.
    const s = _.size(nodeHTML);

    // check if the increment is more than 4%, otherwise is not interesting
    const percentile = (100 / s);
    const percentage = _.round(percentile * lastObservedSize, 2);

    if(percentage > 95) {
        // console.log(`Skipping update as ${percentage}% of the page is already sent (size ${s}, lastObservedSize ${lastObservedSize}) ${window.location.pathname}`);
        return false;
    }

    // this is the minimum size worthy of reporting
    if(s < 100000) {
        console.log("Too small to consider!", s);
        return false;
    }

    // console.log(`Valid update as a new ${_.round(100-percentage, 2)}% of the page have been received (size ${s}, lastObservedSize ${lastObservedSize}) ${window.location.pathname}`);
    lastObservedSize = s;
    return true;
}

const watchedPaths = {
    banner: {
        selector: '.video-ads.ytp-ad-module',
        parents: 4, color: 'blue' },
    ad: {
        selector: '.ytp-ad-player-overlay',
        parents: 4, color: 'darkblue' },
    overlay: {
        selector: '.ytp-ad-player-overlay-instream-info',
        parents: 4, color: 'lightblue' },
    toprightad: {
        selector: 'ytd-promoted-sparkles-web-renderer',
        parents: 3, color: 'aliceblue' },
    toprightpict: {
        selector: '.ytd-action-companion-ad-renderer',
        parents: 2, color: 'azure' },
    toprightcta: {
        selector: '.sparkles-light-cta',
        parents: 1, color: 'violetblue' },
    toprightattr: {
        selector: '[data-google-av-cxn]',
        color: 'deeppink' },
    adbadge: {
        selector: '#ad-badge',
        parents: 4, color: 'deepskyblue' },
    frontad: {
        selector: 'ytd-banner-promo-renderer' },
    // video-ad-overlay-slot
    channel1: {
        selector: '[href^="/channel"]',
        color: 'yellow', parents: 1 },
    channel2: {
        selector: '[href^="/c"]',
        color: 'yellow', parents: 1 },
    channel3: {
        selector: '[href^="/user"]',
        color: 'yellow', parents: 1 },
    searchcard: { selector: '.ytd-search-refinement-card-renderer' },
    channellink: { selector: '.channel-link' },
    searchAds: {
        selector: '.ytd-promoted-sparkles-text-search-renderer',
        parents: 2 },
};

const getOffsetLeft = element => {
  let offsetLeft = 0;
  while(element) {
    offsetLeft += element.offsetLeft;
    element = element.offsetParent;
  }
  return offsetLeft;
}

const getOffsetTop = element => {
  let offsetTop = 0;
  while(element) {
    offsetTop += element.offsetTop;
    element = element.offsetParent;
  }
  return offsetTop;
}

function manageNodes(command, selectorName, selected) {
    // command has .selector .parents .preserveInvisible (this might be undefined)

    const offsetTop = getOffsetTop(selected);
    const offsetLeft = getOffsetLeft(selected);
    let isVisible = (offsetTop + offsetLeft) > 0;
    if(command.preserveInvisible != true) {
        if(!isVisible) {
            // console.log("Ignoring invisible node:", selectorName);
            return;
        }
    }

    // this to highlight what is collected as fragments
    if(config.ux) {
        selected.style.border = '1px solid ' + (command.color ? command.color : 'red');
        selected.setAttribute(selectorName, true);
        selected.setAttribute("yttrex", 1);
    }

    // if escalation to parents, highlight with different color
    if(command.parents) {
        selected = _.reduce(_.times(command.parents), function(memo) {
            // console.log("collecting parent", selectorName, memo.tagName, memo.parentNode.tagName);
            return memo.parentNode;
        }, selected);

        if(config.ux)
            selected.style.border = '3px dotted green';
    }

    if(command.screen) {
        // no screencapture capability in the extension
    }
    const html = selected.outerHTML;
    const hash = html
        .split('')
        .reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0); return a&a},0);

    if(leavesCache[hash]) {
        leavesCache[hash]++;
        return;
        console.log("ignoring because of cache",
            hash, leavesCache[hash], selectorName);
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
        selectorName,
        randomUUID,
    };

    // helpful only at development time:
    // const extra = extractor.mineExtraMetadata(selectorName, acquired);
    // console.table(extra);

    hub.event('newInfo', acquired);
    phase('adv.seen');
};

function leavesWatcher () {
    // inizialized MutationObserver with the selectors and 
    // then a list of functions would handle it
    _.each(watchedPaths, function(command, selectorName) {
        dom.on(command.selector,
            _.partial(manageNodes, command, selectorName)
        );
    })
    // the one below fetch the selectors that might be already
    // present on page, that's why is put after
    _.each(watchedPaths, function(command, selectorName) {
        const ispres = document.querySelectorAll(command.selector);
        if(ispres) {
            _.each(Array(...ispres), function(nod) {
                manageNodes(command, selectorName, nod);
            })
        }
    })
}

function cleanCache() {
    leavesCache = {};
    lastObservedSize = 1;
}

var lastCheck = null;
function refreshUUID () {
    const REFERENCE = 3;
    if (lastCheck && lastCheck.isValid && lastCheck.isValid()) {
        var timed = moment.duration(moment() - lastCheck);
        if (timed.asSeconds() > REFERENCE) {
            randomUUID = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15); /*
            console.log(
                "-> It is more than", REFERENCE, timed.asSeconds(),
                "Refreshed randomUUID", randomUUID); */
        } else { /*
            console.log("-> It is less then", REFERENCE, timed.asSeconds()); */
        }
    };
    lastCheck = moment(); // TODO understand and verify, should this be in the block above?
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
// the userPseudonym from the server - this is not used in ytTREX
function remoteLookup (callback) {
    bo.runtime.sendMessage({
        type: 'remoteLookup',
        payload: {
            config,
            href: window.location.href,
        }
    }, callback);
}

function flush () {
    window.addEventListener('beforeunload', (e) => {
        hub.event('windowUnload');
    });
}

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.
bo.runtime.sendMessage({type: 'chromeConfig'}, (response) => {
    Object.assign(config, response);
    boot();
});
