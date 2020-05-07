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

import {createPanel} from './panel';

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
        console.log(`yttrex version ${config.VERSION}`);
        console.log(config);

        // Register all the event handlers.
        // An event handler is a piece of code responsible for a specific task.
        // You can learn more in the [`./handlers`](./handlers/index.html) directory.
        registerHandlers(hub);

        // Lookup the current user and decide what to do.
        localLookup(response => {
            // `response` contains the user's public key, we save it global for the blinks
            console.log("app.js gets", response, "from localLookup");
            config.publicKey = response.publicKey;
            initializeBlinks();
            adMonitor();
            hrefUpdateMonitor();
            flush();
        });
    } else if (_.startsWith(window.location.origin, 'localhost')) {
        console.log('yttrex in localhost: ignored condition');
        return null;
    }
}

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
    console.log("->",
        _.size(sizecache),
        "new href+content sent, selector", selector,
        Date(), "size", s,
        sizecache,
    );
    return true;
}

const watchedPaths = {
    'banner': '.video-ads.ytp-ad-module', // middle banner
    'ad': '.ytp-ad-player-overlay-instream-info', // ad below
    'channel': '.ytp-title-channel', // title top
    'title': '.ytp-title-text', // title
    'over': '.ytp-chrome-top', // other title top
    'label': '[aria-label]',
};

let contentcache = {};
function adMonitor () {
   
    function lookForExistingNodes(selector, name) {
        const matches = document.querySelectorAll(selector);
        if(!matches.length)
            return false;

        // console.log(name, _.size(matches));
        const acquired = _.map(matches, function(e, i) {
            let content = {
                html: e.outerHTML,
                order: i,
            };
            if(name == 'label')
                content.label = e.getAttribute('aria-label');
            return content;
        });
        // console.log(JSON.stringify(_.map(acquired, 'label')));
        const ready = {
            href: window.location.href,
            name,
            acquired,
        };
        const formatted = JSON.stringify(ready);
        const hash = formatted.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);

        const c = _.get(contentcache, hash);
        // console.log("newVideo/label", _.size(contentcache), matches, acquired, ready,formatted, hash, !!c);

        if(!!c)
            return false;
        _.set(contentcache, hash, { selector, name });

        hub.event('newInfo', {
            ready,
            href: window.location.href,
            contenthash: hash,
            when: Date(),
            selector,
            name,
            randomUUID
        });
        phase('adv.seen');
        return name;
    };
    /*
     * Dear code reader, if you turn out to be a Google employee,
     * you can beat us like a piece of cake just changing the
     * css selector below. or, put bogus content into the title
     * channel, for example.
     *
     * even worst, you can add a css rule for #ads-seen with
     * !important and ruin the experience to every chrome
     * supporter.
     *
     * I mean. really? don't be evil. this is a way to empower
     * people in understanding algorithm society. COME ON!
     */
    window.setInterval(function () {
        const results = _.map(watchedPaths, lookForExistingNodes);
        const printabled = _.compact(results);
        if(_.size(printabled))
            console.log("changeMonitor", printabled);
        // might change nodePeriodicCheck 
    }, nodePeriodicCheck);
}

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
    lastCheck = moment();
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

/*
.########..##.......####.##....##.##....##..######.
.##.....##.##........##..###...##.##...##..##....##
.##.....##.##........##..####..##.##..##...##......
.########..##........##..##.##.##.#####.....######.
.##.....##.##........##..##..####.##..##.........##
.##.....##.##........##..##...###.##...##..##....##
.########..########.####.##....##.##....##..######.
*/

/*
 * phases are all the div which can appears on the right bottom.
 * the function below is called in the code, when the condition is
 * met, and make append the proper span */
var phases = {
    'adv': {'seen': advSeen },
    'video': {'seen': videoSeen, 'wait': videoWait, 'send': videoSend},
    'counters': {
        'adv': { seen: 0 },
        'video': { seen: 0, wait: 0, send: 0}
    }
  };

const VIDEO_WAIT = 'video wait';
const VIDEO_SEEN = 'video seen';
const VIDEO_SEND = 'video send';
const SEEN_ADV = 'seen adv';

const logo = (width = '10px', height = '10px', color = '#000') => {
    return `<svg style="vertical-align: middle; padding: 5px;" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 310">
        <path style="fill:${color}" d="M304.05 151.924a150.38 150.38 0 00-139.82-150v21.16c66.36 5.39 118.71 61.11 118.71 128.84s-52.35 123.45-118.71 128.84v21.16a150.38 150.38 0 00139.82-150zM24.41 151.924c0-67.73 52.35-123.45 118.71-128.84V1.924a150.37 150.37 0 000 300v-21.16c-66.36-5.39-118.71-61.11-118.71-128.84z"/>
        <path style="fill:${color}" d="M102.23 62.824a102.9 102.9 0 00-42.47 131.1l18.42-10.64a81.76 81.76 0 01140.43-81.08l18.43-10.63a102.9 102.9 0 00-134.81-28.75zM194.57 222.754a81.91 81.91 0 01-105.84-21.15l-18.43 10.63a102.9 102.9 0 00177.29-102.31l-18.42 10.6a81.9 81.9 0 01-34.6 102.23z"/>
        <path style="fill:${color}" d="M181.37 103.924a55.41 55.41 0 00-69.52 11.65l18.84 10.88a34.29 34.29 0 0156.52 32.63l18.84 10.87a55.41 55.41 0 00-24.68-66.03zM136.53 181.624a34.35 34.35 0 01-16.39-36.88l-18.84-10.82a55.4 55.4 0 0094.2 54.38l-18.85-10.88a34.33 34.33 0 01-40.12 4.2z"/>
    </svg>
`;
};

function initializeBlinks() {
    config.blinks = createPanel({
        [VIDEO_WAIT]: {color: '#00aefe'},
        [VIDEO_SEEN]: {color: '#269072'},
        [VIDEO_SEND]: {color: '#c03030'},
        [SEEN_ADV]: {color: '#ffb545'}
    }, `
<div>
    <h2>
        <a href="https://youtube.tracking.exposed" target=_blank>youtube</a>.<a href="https://tracking.exposed" target=_blank>tracking.exposed</a>
    </h2>
    <p style="font-size: 1.2rem">This is a free software browser extention. Data is processed for academic and digital activism purposes. <b>We scrutinize the algorithms and their effects</b>.</p>
    <p style="font-size: 1.2rem">You can see the nearby icons <span>${logo('10px', '10px', '#bbb')}</span> and they blink. Each position/color is a different stage in the evidence collection.</p>
    <br /><br />
    <ul style="list-style-type: none;">
        <li style="font-size: 1.2rem">${logo('15px', '15px', '#00aefe')} Video seen, waiting loading complete</li>
        <li style="font-size: 1.2rem">${logo('15px', '15px', '#269072')} New video seen</li>
        <li style="font-size: 1.2rem">${logo('15px', '15px', '#c03030')} Video is sent to a server. <a href="${config.WEB_ROOT}/personal/#${config.publicKey}" target=_blank><b>A</b>ccess your data</a>.</li>
        <li style="font-size: 1.2rem">${logo('15px', '15px', '#ffb545')} Advertising spotted and sent</li>
        <!-- if you read this code, please consider a small git commit as contribution :)
             we're short in resources and the project is ambitious! -->
    </ul>
    <br />
    <h3>
        The 25th of March 2020, join the first <a href="https://youtube.tracking.exposed/wetest/1" target=_blank>Collective Algorithm Observation</a>.
    </h3>
</div>
`
    );
}

/* below the 'span creation' function mapped in the dict phases above */
function videoWait (path) {
    config.blinks[VIDEO_WAIT]();
}
function videoSeen (path) {
    config.blinks[VIDEO_SEEN]();
}
function videoSend (path) {
    config.blinks[VIDEO_SEND]();
}
function advSeen (path) {
    config.blinks[SEEN_ADV]();
};
