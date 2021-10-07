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

import config from './config';
import hub from './hub';
import dom from './dom';
import { registerHandlers } from './handlers/index';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;
// below the usage of unnecessary code
let feedId = (Math.random() + "-init-" + _.random(0, 0xffff));
let feedCounter = 0;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {
    if (_.endsWith(window.location.origin, 'tiktok.tracking.exposed')) {
        if (_.isUndefined($('#extension--parsable').html())) {
        } else {
            // $(".extension-missing").hide();
        }
        return;
    } else if (_.endsWith(window.location.origin, 'tiktok.com')) {
        // this get executed only on youtube.com
        console.log(`tktrex ${JSON.stringify(config)}`);

        // Register all the event handlers.
        // An event handler is a piece of code responsible for a specific task.
        // You can learn more in the [`./handlers`](./handlers/index.html) directory.
        registerHandlers(hub);

        // Lookup the current user and decide what to do.
        localLookup(response => {
            // `response` contains the user's public key, we save it global for the blinks
            console.log("app.js gets", response,
                "from localLookup, and accessId", feedId);

            /* these parameters are loaded from localstorage */
            config.publicKey = response.publicKey;
            config.active = response.active;
            config.ux = response.ux;

            if(config.active !== true) {
                console.log("TikTokTREX disabled!"); // TODO some UX change
                return null;
            }

            hrefUpdateMonitor();
            flush();
        });
    } else if (_.startsWith(window.location.origin, 'localhost')) {
        console.log('TikTokTrex in localhost: ignored condition');
    }
}

const selectors = {
    video: 'video',
    suggested: 'div[class$="DivUserContainer"]',
    title: 'h1',
    creator: 'a[href^="/@"]',
};

function hrefUpdateMonitor() {
    /* this initizalise dom listened by mutation observer */
    const sugwat = dom.on(selectors.suggested, handleSuggested);
    const vidwat = dom.on(selectors.video, handleVideo);
    const creatwat = dom.on(selectors.creator, handleTest);
    console.log("Listener installed ",
        JSON.stringify(selectors), sugwat, vidwat);

    /* and monitor href changes to randomize a new accessId */
    let oldHref = document.location.href;
    const bodyList = document.querySelector("body");
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (oldHref != document.location.href) {
                console.log(oldHref, "changed", document.location.href, feedId, feedCounter);
                // TODO url parsing
                oldHref = document.location.href;
                feedCounter++;
                feedId = Math.random() + "++" + feedCounter;
            }
        });
    });
    var config = {
        childList: true,
        subtree: true
    };
    observer.observe(bodyList, config);
}

let videoCounter = 0;
function handleTest(element) {
    return null;
}

function handleSuggested(elem) {
    console.log("handleSugg", elem, "should go to parentNode");
    hub.event('suggested', {
        html: elem.parentNode.outerHTML,
        href: window.location.href,
    });
}

function handleVideo(elem) {

    const refe = _.reduce(_.times(20),
        function(memo, iteration) {
            const check = memo.parentNode.outerHTML.length;
            if(check < 10000)
                console.log(videoCounter, iteration, check);
            return (check > 10000) ? memo : memo.parentNode;
        }, elem);

    console.log(refe);

    if(refe.hasAttribute('trex')) {
        console.log("Element already acquired: skipping")
        return null;
    }
    videoCounter++;
    console.log("New element found, marking as ", videoCounter);
    refe.setAttribute('trex', videoCounter);
    hub.event('newVideo', {
        html: refe.outerHTML,
        href: window.location.href,
        feedId,
        feedCounter,
        videoCounter,
        rect:  refe.getBoundingClientRect(),
    })
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
