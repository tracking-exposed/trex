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
import { getTimeISO8601, getLogoDataURI } from './utils';
import { registerHandlers } from './handlers/index';
import pseudonym from './pseudonym';

const YT_VIDEOTITLE_SELECTOR = 'h1.title';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// Boot the user script. This is the first function called.
// Everything starts from here.
function boot () {

    if(_.endsWith(window.location.origin, 'youtube.tracking.exposed')) {
        if(_.isUndefined($("#extension--parsable").html())) {
            return null;
        } else {
            $(".extension-missing").hide();
            /* this call the API `handshake`, which state a commitment of playing the videos
             * on the list, in this way, the result can be linked together */
            return remoteLookup(response => {
                console.log("remoteLookup answer with:", response);
                var pseudoName = JSON.parse(response.response).p;
                pseudonym.set(pseudoName);
                $("#userName").text(pseudonym.get());
                $(".extension-present").show();
            });
        }
    } else if(_.endsWith(window.location.origin, 'youtube.com')) {
        // this get executed only on youtube.com
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
            // hrefUpdateMonitor();
            keepChecking();
            console.log("hrefUpdate");
            hrefUpdateMonitor();
            flush();
        });
    } else if(_.startsWith(window.location.origin, 'localhost')) {
        console.log("localhost: ignored condition");
    }
}

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

//    div.appendChild(getLogoDataURI());

    console.log("Created logo div");
    $("#loadiv").show();
};

const phases = {
    'adv': {'seen': advSeen },
    'video': {'seen': videoSeen, 'wait': videoWait, 'send': videoSend},
    'counters' : {
        'adv': { seen: 0 },
        'video': { seen: 0, wait: 0, send: 0}
    }
}

function videoWait(path) {
    buildSpan({
        path,
        position: 1,
        text: 'video wait',
        duration: 400,
    });
}
function videoSeen(path) {
    buildSpan({
        path,
        position: 2,
        text: 'video seen',
        duration: 7500,
    });
    $("#video-seen").css('background-color', 'green');
    $("#video-seen").css('cursor', 'cell');
    $("#video-seen").click(function() {
        if( testElement($('ytd-app'), 'ytd-app') ) {
            phase('video.send');
        }
    })
}
function videoSend(path) {
    buildSpan({
        path,
        position: 3,
        text: 'video send',
        duration: 400,
    });
    $("#video-seen").css('background-color', 'red');
    $("#video-seen").css('color', 'white');
}
function advSeen(path) {
    buildSpan({
        path,
        position: 4,
        text: 'seen adv',
        duration: 400,
    });
};

function buildSpan(c) {
    var cnt = _.get(phases.counters, c.path);
    cnt +=1;
    var id = _.replace(c.path, /\./, '-');
    _.set(phases.counters, c.path, cnt);

    var infospan = null;
    var fullt = `${cnt} ▣ ${c.text}`;
    if(cnt == 1) {
        console.log("+ building span for the first time", c, cnt);
        infospan = document.createElement('span');
        infospan.setAttribute('id', id);
        infospan.style.position = 'fixed';
        infospan.style.width = '80px';
        infospan.style.height = '10px';
        infospan.style.right = '5px';
        infospan.style.color = 'lightgoldenrodyellow';
        infospan.style.bottom = (c.position * 16) + 'px';
        infospan.style.size = '0.7em';
        infospan.style.padding = '2px';
        infospan.style['border-radius'] = '10px';
        infospan.style.background = '#707ddad1';
        infospan.textContent = fullt;
        document.body.appendChild(infospan);
        /* change infospan in jquery so no proble in apply .fadeOut */
        infospan = $("#" + id);
    } else {
        infospan = $("#" + id);
        infospan.text(fullt);
    }

    $("#loadiv").show();
    infospan.css('display', 'flex');
    infospan.fadeOut({ duration: c.duration});
}

function phase(path) {
    const f = _.get(phases, path);
    f(path);
}

var lastVideo = null;
function hrefUpdateMonitor() {

    function changeHappen() {

        // phase('video.wait');
        let diff = (window.location.href != lastVideo);
        // if the loader is going, is debugged but not reported, or the 
        // HTML and URL mismatch 
        if( diff && $("#progress").is(':visible') ) {
            console.log(`Loading in progress for ${window.location.href} after ${lastVideo}, waiting again...`);
            return false;
        }
        lastVideo = window.location.href;
        return diff;
    }
    const periodicTimeout = 5000;
    const iconDuration = 1200;

    window.setInterval(function() {
        if(changeHappen()) {

            phase('video.seen');
            document
                .querySelectorAll(YT_VIDEOTITLE_SELECTOR)
                .forEach(function() {
                    console.log("Video Selector match in ", window.location.href,", sending", _.size($('ytd-app').html()));
                    if( testElement($('ytd-app'), 'ytd-app') )
                        phase('video.send');
                });

            window.setTimeout(function() {
                phase('video.send')
            }, iconDuration);
        }
    }, periodicTimeout);
}

let cache = [];
let last = null;
function testElement(elem, selector) {

    const s = _.size(elem.outerHTML);

    const exists = _.reduce(cache, function(memo, e, i) {
        const evalu = _.eq(e, s);
        /* console.log(memo, s, e, evalu, i); */
        if(!memo)
            if(evalu)
                memo = true;

        return memo;
    }, false);

    if(exists)
        return false;

    cache.push(s);

    hub.event('newVideo', {
        element: elem.outerHTML,
        href: window.location.href,
        when: Date(),
        selector,
        size: s,
    });
    console.log("->",
        _.size(cache),
        "new element sent as newVideo",
        Date(),
        s,
        cache,
    );

    let diff = (window.location.href != last);
    if(diff) {
        console.log(`new location found, ${last} ${window.location.href} cache cleaning ${_.size(cache)}`
        );
        last = window.location.href;
        cache = [];
    }
    return true;
}

function keepChecking() {

    window.setInterval(function() {

        let titleTop = ".ytp-title-channel";
        document
            .querySelectorAll(titleTop)
            .forEach(function(element) {
                if(testElement(element, titleTop))
                    phase('adv.seen');
            });

        let adbelow = ".ytp-ad-player-overlay-instream-info";
        document
            .querySelectorAll(adbelow)
            .forEach(function(element) {
                if(testElement(element, adbelow))
                    phase('adv.seen');
            });

        let middleBanner = ".video-ads.ytp-ad-module";
        document
            .querySelectorAll(middleBanner)
            .forEach(function(element) {
                if(testElement(element, middleBanner))
                    phase('adv.seen');
            });

    }, 10000);
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
