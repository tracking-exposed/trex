// # Welcome to the extension docs!
// Here you can learn how the extension works and, if this is what you aim for,
// where to put your hands to hack the code.
//
// ## Structure of the extension
// The extension has two parts:
//  - a content script
//  - event pages.
//
// The **content script** is the JavaScript code injected into the Facebook.com
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

// # Code
// Import the styles for the app.
require('../styles/app.scss');

// Import the react toolkit.
// Seems like importing 'react-dom' is not enough, we need to import 'react' as well.
import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

// Import other utils to handle the DOM and scrape data.
import uuid from 'uuid';
import $ from 'jquery';
import 'arrive';

import config from './config';
import hub from './hub';
import { getTimeISO8601 } from './utils';
import { registerHandlers } from './handlers/index';
import token from './token';

import OnboardingBox from './components/onboardingBox';

// const YT_VIDEOTITLE_SELECTOR = '#container > h1 > yt-formatted-string';
// const YT_VIDEOTITLE_SELECTOR = 'h1 .title';
const YT_VIDEOTITLE_SELECTOR = '#page-manager';

// bo is the browser object, in chrom is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {
    console.log(`yttrex version ${config.VERSION} build ${config.BUILD} loading.`);
    console.log('Config:', config);

    // Register all the event handlers.
    // An event handler is a piece of code responsible for a specific task.
    // You can learn more in the [`./handlers`](./handlers/index.html) directory.
    registerHandlers(hub);


    // Lookup the current user and decide what to do.
    userLookup(response => {

        // `response` contains the user's public key and its status,
        // if the key has just been created, the status is `new`.
        console.log("userLookup responded:", response, "but we don't care at the moment of the onboarding");

        // The user compose this unique message and is signed with their PGP key
        // we returns an authentication token, necessary to log-in into the personal page
        // selector is returned, accessToken is saved as side-effect (it could be cleaner)
        let uniqueMsg = `¼ #${response.publicKey}# key of #${config.userId}#, uniq: ` + Math.random();
        // this can be used to verify presente of privateKey associated to our own publicKey
        bo.runtime.sendMessage({
            type: 'userInfo',
            payload: {
                message: uniqueMsg,
                userId: config.userId,
                version: config.VERSION,
                publicKey: response.publicKey,
                optin: response.optin
            },
            userId: config.userId
        }, (response => {
            try {
                /* this could raise an exception if JSON.parse fails, but
                 * there is a default hardcoded in the extension */
                token.set(JSON.parse(response.response).token);
            } catch(e) {
                console.log("token retrieve fail:", e.description);
            } finally {
                console.log("Token received is [", token.get(), "]");
                acquireYThtml();
                hrefUpdateMonitor();
                flush();
            }
        }));
    });
}

var currentPage = window.location.href;

function hrefUpdateMonitor() {

    // listen for changes
    setInterval(function() {
        if (currentPage != window.location.href) {
            // page has changed, set new page as 'current'
            console.log("page update detected, from", currentPage, "to", window.location.href);
            currentPage = window.location.href;
            acquireYThtml();
        }
    }, 1500);
}


// The function `userLookup` communicates with the **action pages**
// to get information about the current user from the browser storage
// (the browser storage is unreachable from a **content script**).
function userLookup (callback) {
    if(config.userId === 'missingCookie') 
        console.log("Missing cookie? please investigate");

    console.log("userLookup", config);

    bo.runtime.sendMessage({
        type: 'userLookup',
        payload: {
            userId: config.userId
        }
    }, callback);

}

// This function will first trigger a `newVideo` event and wait is any new title arise
function acquireYThtml() {
    document.querySelectorAll(YT_VIDEOTITLE_SELECTOR).forEach(acquireVideo);
}

function flush () {
    window.addEventListener('beforeunload', (e) => {
        hub.event('windowUnload');
    });
}

function acquireVideo (elem) {
    console.log("acquireVideo, add event newVideo");
    console.log(window.location.href);

    hub.event('newVideo', { element: $(elem).html(), href: window.location.href});
}

// Before booting the app, we need to update the current configuration
// with some values we can retrieve only from the `chrome`space.
bo.runtime.sendMessage({type: 'chromeConfig'}, (response) => {
    Object.assign(config, response);
    boot();
});
