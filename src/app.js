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
import { getTimeISO8601, getLogoDataURI } from './utils';
import { registerHandlers } from './handlers/index';
import pseudonym from './pseudonym';

const YT_VIDEOTITLE_SELECTOR = 'h1.title';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {

    if(window.location.origin !== 'https://www.youtube.com') {
        /* we are on .tracking.exposed because this + youtube.com
         * are the only two permitted domain where the extension run */
        if(_.isUndefined($("#extension--parsable").html())) {
            console.log(`The page ${window.document.location.href} should not be processed by the ytTREX extension`);
            return null;
        } else {
            remoteLookup(response => {
                // Basically I'm waiting to be sure the API handshare has answered 
                var badpattern = window.setInterval(function() {
                    try {
                        pseudonym.set(JSON.parse(response.response).p);
                        if(!_.isNull(pseudonym.get())) {
                            window.clearInterval(badpattern);
                            return testDivergency();
                        }
                    } catch (error) {}
                }, 200);
            });
        }
    }

    // youtube.com
    console.log(`yttrex version ${config.VERSION} build ${config.BUILD} loading; Config object:`);
    console.log(config);

    // is an hidden div, created on youtube.com domain,
    // visibile when the recording is triggered
    createLoadiv();

    // Register all the event handlers.
    // An event handler is a piece of code responsible for a specific task.
    // You can learn more in the [`./handlers`](./handlers/index.html) directory.
    registerHandlers(hub);

    // Lookup the current user and decide what to do.
    localLookup(response => {
        // `response` contains the user's public key and its status,
        console.log("localLookup responded:", response);
        hrefUpdateMonitor();
        flush();
    });
}

function testDivergency() {

    $("#userName").text(pseudonym.get());

    var vl = null;
    try {
        vl =  JSON.parse($("#video--list pre").html() );
        console.log(`Parsed ${vl.list.length} videos`);
        // display the button if we are sure we have videos
        $("#playnow").toggle();
    } catch(error) {
        console.log(error);
        $("#error").toggle();
    }
    $(".extension-present").show();

    $("#playnow").on('click', function() {
        bo.runtime.sendMessage({
            type: 'opener',
            payload: _.extend(vl)
        }, response => {
            console.log(config);
            console.log(vl);
            $("#playnow").text(`In progress, wait for ${vl.humanize}`);
            const changeTextT = window.setTimeout(function() {
                var testHref = `/r/${vl.testId}/${vl.testName}`;
                $("#playnow").html(`<div class='done'>done! you can close the tabs and <a href=${testHref}>see results</a>.</div>`);
            }, vl.seconds * 1000);
        });
    });
};

function createLoadiv() {
    // this is bound to #loadiv and appears on the right bottom
    var div = document.createElement('div');

    div.style.position = 'fixed';
    div.style.width = '48px';
    div.style.height = '48px';
    div.style.right = '10px';
    div.style.bottom= '10px';

    div.setAttribute('id', 'loadiv');
    document.body.appendChild(div);

    var img = document.createElement('img');
    img.setAttribute('src', getLogoDataURI());
    div.appendChild(img);

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
    const periodicTimeout = 5000;
    const iconDuration = 1200;

    window.setInterval(function() {
        if(changeHappen()) {
            $("#loadiv").toggle();
            document.querySelectorAll(YT_VIDEOTITLE_SELECTOR).forEach(acquireVideo);

            window.setTimeout(function() {
                $("#loadiv").hide();
            }, iconDuration);

        }
    }, periodicTimeout);
}

function acquireVideo (elem) {
    /* there is not yet a client-side URL check, but this event get triggered only when a 
     * new 'video Title' appear */
    console.log(`acquireVideo: ${window.location.href}`);

    /* the <ytd-app> represent the whole webapp root element */
    hub.event('newVideo', { element: $('ytd-app').html(), href: window.location.href });
}

// The function `localLookup` communicates with the **action pages**
// to get information about the current user from the browser storage
// (the browser storage is unreachable from a **content script**).
function localLookup (callback) {
    bo.runtime.sendMessage({
        type: 'localLookup',
        payload: {
            userId: config.userId
        }
    }, callback);
}

// The function `remoteLookup` communicate the intention
// to the server of performing a certain test, and retrive 
// the userPseudonym from the server
function remoteLookup (callback) {
    bo.runtime.sendMessage({
        type: "remoteLookup",
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
