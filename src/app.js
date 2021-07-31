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
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';

import {paintReplacement} from './replacement';
import config from './config';
import hub from './hub';
import { registerHandlers } from './handlers/index';

const YT_VIDEOTITLE_SELECTOR = 'h1.title';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// variable used to spot differences due to refresh and url change
let randomUUID = 'INIT' + Math.random().toString(36).substring(2, 13) +
                Math.random().toString(36).substring(2, 13);

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {
    if (_.endsWith(window.location.origin, 'youtube.tracking.exposed')) {
        if (_.isUndefined($('#extension--parsable').html())) {
            return null;
        } else {
            // $(".extension-missing").hide();
            return null;
        }
    } else if (_.endsWith(window.location.origin, 'youtube.com')) {
        // this get executed only on youtube.com
        console.log(`YC.AI version ${config.VERSION}`);
        console.log(config);

        // Register all the event handlers.
        // An event handler is a piece of code responsible for a specific task.
        // You can learn more in the [`./handlers`](./handlers/index.html) directory.
        registerHandlers(hub);

        // Lookup the current user and decide what to do.
        localLookup(response => {
            // `response` contains the user's public key, we save it global for the blinks
            console.log("app.js gets", response, "from localLookup");

            /* these parameters are loaded from localstorage */
            config.publicKey = response.publicKey;
            config.active = response.active;
            config.svg = response.svg;
            config.videorep = response.videorep;

            // nota il significato di questi flag non è consistente
            if(config.svg !== true) {
                console.log("YC.AI disabled! + do UX changes?"); 
                // bo.browserAction.setIcon({path: '../icons/icon-disabled.png'});
                // browserAction is undefined
                return null;
            }

            if(matchUXhackURL(window.location.path)) {
                initializeHackedSVG();
            }
            // hrefUpdateMonitor();
            // flush();
        });
    } else if (_.startsWith(window.location.origin, 'localhost')) {
        console.log('YC.AI in localhost: ignored condition');
        return null;
    }
}

/* UX modifier */

function matchUXhackURL(pathname) {
    console.log("regexp", pathname);
}

let initializedWatchers = false;
function initializeHackedSVG() {
    if(!initializedWatchers) {
        console.log("This should be the first time you see this");
        initializedWatchers = true;
    } else {
        return;
    }

    /* actual code for monitoring */
    const needResize = checkRecommendationStatus();
    if(needResize)
        console.log("we'll redraw");
}

let lastObservedSize = null;
function checkRecommendationStatus() {
    const rw = $(".ytd-watch-next-secondary-results-renderer").clientWidth;
    if(lastObservedSize === rw)
        return false;

    // also check if fullscreen 
    lastObservedSize = rw;
    return true;
}

// completed 

function phase (path) {
    const f = _.get(phases, path);
    f(path);
}

const hrefPERIODICmsCHECK = 9000;
const nodePERIODICmsCHECK = 4000;
let nodePeriodicCheck = nodePERIODICmsCHECK; // this check is dynamics, it grows if nothing change
let hrefPeriodicCheck = hrefPERIODICmsCHECK;
var lastVideoURL = null;
var lastVideoCNT = 0;

function hrefUpdateMonitor () {
    window.setInterval(function () {
        // phase('video.wait');
        let diff = (window.location.href !== lastVideoURL);

        // client might duplicate the sending of the same
        // video. using a random identifier, we spot the
        // clones and drop them server side.
        // also, here is cleaned the cache declared below
        if (diff) {
            phase('video.seen');
            cleanCache();
            refreshUUID();
        }
        if (!diff) {
            lastVideoCNT++;
            if (lastVideoCNT > 3) {
                // console.log(lastVideoCNT, "too many repetition: stop");
                return;
            }
        }

        lastVideoURL = window.location.href;
        document
            .querySelectorAll(YT_VIDEOTITLE_SELECTOR)
            .forEach(function () { /*
                console.log("Video Selector match in ",
                    window.location.href,
                    ", sending",
                    _.size($('ytd-app').html()),
                    " <- ",
                    $(YT_VIDEOTITLE_SELECTOR).length,
                    $(YT_VIDEOTITLE_SELECTOR).text()
                ); */
                if (sizeCheck($('ytd-app').html(), 'ytd-app')) { phase('video.send'); }
            });
    }, hrefPeriodicCheck);
}

let sizecache = [];
function sizeCheck(nodeHTML, selector) {
    // this function look at the LENGTH of the proposed element.
    // this is used in video because the full html body page would be too big
    // this is also a case of premature optimization. known mother of all evil.

    // if an element with the same size has been already sent with
    // this URL, this duplication is ignored.

    const s = _.size(nodeHTML);
    if(!s)
        return false;
    if(sizecache.indexOf(s) != -1)
        return false;

    sizecache.push(s);
    hub.event('newVideo', {
        element: nodeHTML,
        href: window.location.href,
        when: Date(),
        selector,
        size: s,
        randomUUID
    });
    /* console.log("->",
        _.size(sizecache),
        "new href+content sent, selector", selector,
        Date(), "size", s,
        sizecache,
    ); */
    return true;
}

let contentcache = {};

function cleanCache() {
    contentcache = {};
    sizecache = [];
}

var lastCheck = null;
function refreshUUID () {
    const REFERENCE = 3;
    if (lastCheck && lastCheck.isValid && lastCheck.isValid()) {
        var timed = moment.duration(moment() - lastCheck);
        if (timed.asSeconds() > REFERENCE) {
            // here is an example of a non secure random generation
            // but doesn't matter because the query on the server we
            // has this with the user publicKey, so if someone wants to
            // corrupt their data: they can ¯\_(ツ)_/¯
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
// the userPseudonym from the server - this is not used in YC.AI 
function remoteLookup (callback) {
    bo.runtime.sendMessage({
        type: 'remoteLookup',
        payload: {
            // window.location.pathname.split('/')
            // Array(4) [ "", "d", "1886119869", "Soccer" ]
            // window.location.pathname.split('/')[2]
            // "1886119869"
            testId: window.location.pathname.split('/')[2]
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
