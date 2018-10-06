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

// Import the react toolkit.
// Seems like importing 'react-dom' is not enough, we need to import 'react' as well.
import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

// Import other utils to handle the DOM and scrape data.
import uuid from 'uuid';
import $ from 'jquery';
import _ from 'lodash';

import config from './config';
import hub from './hub';
import { getTimeISO8601 } from './utils';
import { registerHandlers } from './handlers/index';
import token from './token';

const YT_VIDEOTITLE_SELECTOR = 'h1.title';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {

    console.log(`yttrex version ${config.VERSION} build ${config.BUILD} loading; Config object:`);
    console.log(config);

    if(window.location.origin !== 'https://www.youtube.com') {
        /* we are on .tracking.exposed because this + youtube.com
         * are the only two permitted domain where the extension run */
        return testDivergency();
    }

    createLoadiv();

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
        let once = `publicKey ${response.publicKey}# loading ytTREX ${config.VERSION} ${config.BUILD}`;
        // the token is necessary to access to the personal page, but the most of the interaction happen on the 'concept is used as authentication of privateKey associated to our own publicKey
        bo.runtime.sendMessage({
            type: 'userInfo',
            payload: {
                message: once,
                userId: 'local',
                version: config.VERSION,
                publicKey: response.publicKey,
                optin: response.optin
            },
            userId: 'local',
        }, (response => {
            try {
                /* this could raise an exception if JSON.parse fails, but
                 * there is a default hardcoded in the extension */
                token.set(JSON.parse(response.response).token);
            } catch(e) {
                console.log("token retrieve fail:", e.description);
            } finally {
                console.log("Token received is [", token.get(), "]");
                hrefUpdateMonitor();
                flush();
            }
        }));
    });
}

function testDivergency() {
    $(".extension-missing").hide();

    var vl = null;
    try {
        var vl =  JSON.parse($("#video--list").text() );
        console.log(`Parsed ${vl.list.length} videos`);
        // display the button if we are sure we have videos
        $("#video--list").append("<button id='playnow'>ytTREX re-play!</button>");
    } catch(error) {
        $("#video--list").append("<div>Error! video not found, try to reload the page</div>");
    }

    $("#playnow").on('click', function() {
        bo.runtime.sendMessage({
            type: 'opener',
            payload: _.extend(vl)
        }, response => {
            $("#playnow").html(`<div class='inprogress'>Re-Playing videos, wait for ${vl.humanize}...</div>`);
        });
    });
};

function createLoadiv() {
    // this is bound to #loadiv and appears on the right bottom
    var div = document.createElement('div');

    div.style.position = 'fixed';
    div.style.width = '40px';
    div.style.height = '40px';
    div.style['font-size'] = '3em';
    div.style['border-radius'] = '5px';
    div.style['text-align'] = 'center';
    div.style['background-color'] = '#c9fbc6';
    div.style.right = '10px';
    div.style.bottom= '10px';

    div.setAttribute('id', 'loadiv');
    div.innerText = '👁 ';
    document.body.appendChild(div);

    $("#loadiv").toggle();
};

var last = null;

function hrefUpdateMonitor() {

    function changeHappen() {
        let diff = (window.location.href !== last);
        // if the loader is going, is debugged but not reported, or the 
        // HTML and URL mismatch 
        if( diff && $("#progress").is(':visible') ) {
            console.log(`Loading in progress for ${window.location.href} after ${last}, waiting again...`);
            return false;
        }
        last = window.location.href;
        return diff;
    }
    const periodicTimeout = 4000;
    const iconDuration = 800;

    window.setInterval(function() {
        if(changeHappen()) {
            $("#loadiv").toggle();
            var displayTimer = window.setInterval(function() {
                $("#loadiv").hide();
                document.querySelectorAll(YT_VIDEOTITLE_SELECTOR).forEach(acquireVideo);
                hrefUpdateMonitor();
                window.clearInterval(displayTimer);
            }, iconDuration);
        }
    }, periodicTimeout);
}

function acquireVideo (elem) {
    /* there is not yet a client-side URL check, but this event get triggered only when a 
     * new 'video Title' appear */
    console.log(`acquireVideo: ${window.location.href}`);

    /* the <ytd-app> represent the whole webapp root element */
    hub.event('newVideo', { element: $('ytd-app').html(), href: window.location.href});
}


// The function `userLookup` communicates with the **action pages**
// to get information about the current user from the browser storage
// (the browser storage is unreachable from a **content script**).
function userLookup (callback) {
    console.log("userLookup: ", JSON.stringify(config));
    bo.runtime.sendMessage({
        type: 'userLookup',
        payload: {
            userId: config.userId
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
