#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('parser:video');
const errorrevi = require('debug')('related:view');
const errorcore = require('debug')('metadata:core');
const errorlike = require('debug')('metadata:likes');
const errorview = require('debug')('metadata:view');
const errorrele = require('debug')('metadata:related');
const parse = require('../lib/parse');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

function parseViews(D) {
    const node = _.first(D.getElementsByClassName('view-count'));
    const viewStr = node.innerHTML
    let tmp = _.first(viewStr.split(' '))
    const viewNumber = _.parseInt(tmp.replace(/[.,]/g, ''));
    return { viewStr: viewStr, viewNumber: viewNumber };
};

function parseLikes(D) {
    const nodes = D.querySelectorAll('.ytd-toggle-button-renderer > yt-formatted-string');
    const likes = nodes[0].getAttribute('aria-label');
    const dislikes = nodes[1].getAttribute('aria-label');
    return { likes: likes, dislikes: dislikes };
};

function labelForcer(l) {
    // La Super Pattuglia -  HALLOWEEN Special - Car City 🚗 Cartone animato per i bambini di Tom il Carro Attrezzi a Car City 5 mesi fa 22 minuti 63.190 visualizzazioni
    // The Moons of Mars Explained -- Phobos & Deimos MM#… Nutshell 4 years ago 115 seconds 2,480,904 views

    let first = _.reverse(l.split(' '));
    let viz = [];

    let second = _.reduce(first, function(memo, e) {
        if(typeof viz == 'string') {
            memo.push(e);
            return memo;
        }
        let test = _.parseInt(e.replace(/[.,]/, ''));
        if(!_.isNaN(test)) {
            viz.push(e);
            _.reverse(viz);
            viz = _.join(viz, ' ');
        }
        else {
            viz.push(e);
        }
        return memo; 
    }, []);

    let duration = [];
    let third = _.reduce(second, function(memo, e) {
        if(typeof duration == 'string') {
            memo.push(e);
            return memo;
        }
        let test = _.parseInt(e.replace(/[.,]/, ''));
        if(!_.isNaN(test)) {
            duration.push(e);
            _.reverse(duration);
            duration = _.join(duration, ' ');
        }
        else {
            duration.push(e);
        }
        return memo; 
    }, []);

    let timeago = [];
    let fourth = _.reduce(third, function(memo, e) {
        if(typeof timeago == 'string') {
            memo.push(e);
            return memo;
        }
        let test = _.parseInt(e.replace(/[.,]/, ''));
        if(!_.isNaN(test)) {
            timeago.push(e);
            _.reverse(timeago);
            timeago = _.join(timeago, ' ');
        }
        else {
            timeago.push(e);
        }
        return memo; 
    }, []);

    let title = _.join(_.reverse(fourth), ' ');

    return {
        viz,
        duration,
        timeago,
        title
    };
}

function relatedMetadata(e, i) {

    let source, verified, vizstr, foryou;
    const title = e.querySelector('#video-title').textContent;
    const metadata = e.querySelector('#metadata');

    if(metadata.children.length > 0)
        source = metadata.children[0].textContent;

    if(metadata.children.length > 1)
        vizstr = metadata.children[1].textContent;

    if(vizstr && _.size(vizstr))
        foryou = vizstr.match(/\d+/) ? false : true;

    const link = e.querySelectorAll('a')[0].getAttributeNode('href').value
    const videoId = link.replace(/.*v=/, '');
    const videometablockN = e.querySelectorAll('.ytd-video-meta-block').length

    let displayTime, expandedTime;
    if(e.querySelector('.ytd-thumbnail-overlay-time-status-renderer')) {
        displayTime = e
            .querySelector('.ytd-thumbnail-overlay-time-status-renderer')
            .textContent; // '3:02'
        expandedTime = e
            .querySelector('.ytd-thumbnail-overlay-time-status-renderer')
            .getAttribute('aria-label'); //'3 minutes, 2 seconds'
    }
    const longlabel = e.querySelector('#video-title').getAttribute('aria-label');
    // Beastie Boys - Sabotage by BeastieBoys 9 years ago 3 minutes, 2 seconds 62,992,821 views

    const mined = longlabel ? labelForcer(longlabel) : null;
    // mined is not used yet; it might be handy. please note sometime is empty
    // e1895eed23ffcb8a0b5d1221c28a712b379886fe

    // if is verified, the keyword vary language by language, but you've always 
    // TED\nVerified\n•
    let lines = source.split("\n"); 
    if(_.size(lines) > 1) {
        verified = true;
        source = _.first(lines);
        source = source.replace("•", '');
    } else {
        verified = false;
        source = _.first(lines);
        source = source.replace("•", '');
    }

    return {
        index: i + 1,
        title,
        verified,
        source,
        vizstr,
        foryou,
        videoId,
        displayTime,
        expandedTime,
        longlabel,
        mined,
    };
};

function parseSingleTry(D, memo, spec) {
    const elems = D.querySelectorAll(spec.selector);

    if(!_.size(elems)) {
        debug("zero element selected: %s fail", spec.name);
        return memo;
    }

    if(!spec.selected && _.size(elems) > 1)
        debug("%s with %s gives %d elements. only the 1st kept", spec.name, spec.selector, _.size(elems));

    if(spec.selected)
        debug("this look like a too overcomplex framework to define scraper... %d", spec.selected);

    const source = spec.selected ?  _.nth(elems, spec.selected) : _.first(elems);

    try {
        const candidate = source[spec.func];
        if(_.size(candidate)) {
            if(memo)
                debug("Replacing [%s] with [%s] by %s", memo, candidate, spec.name);
            return candidate;
        }
    } catch(error) {
        return memo;
    }
};

function manyTries(D, opportunities) {
    const r = _.reduce(opportunities, _.partial(parseSingleTry, D), null);
    debug("manyTries: %j: %s", _.map(opportunities, 'name'), r);
    return r;
};


function mineAuthorInfo(D) {

    const as = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a');
    if(_.size(as) == 1) {
        debugger;
        return null;

    } else if(_.size(as) == 2) {
        const authorName = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[1].textContent;
        const authorSource = D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[0].getAttribute('href');

        debug("%s and %s should lead to the same youtube-content-page", 
            D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')[1].getAttribute('href'),
            authorSource );

        return { authorName, authorSource };
    
    } else {
        debug("odd the size is not 1 not 2!");
        debugger;
        // this creat an odd: '{"0":{},"1":{}}'
        // and someone might spot it :)
        return { authorName: JSON.stringify(D.querySelector('a.ytd-video-owner-renderer').parentNode.querySelectorAll('a')),
                 authorSource: "" };
    }
}

function processVideo(D) {

    const title = manyTries(D, [{
        name: 'title h1',
        selector: 'h1 > yt-formatted-string',
        expected: null,
        selected: null,
        func: 'textContent'
    }, {
        name: 'title ytp-title',
        selector: '.ytp-title',
        expected: null,
        selected: null,
        func: 'textContent'
    } ]);
    if(!title)
        throw new Error("unable to get title");

    const check = D.querySelectorAll('a.ytd-video-owner-renderer').length; // should be 1
    const { authorName, authorSource } = mineAuthorInfo(D);
    const ptc = D.querySelectorAll('[slot="date"]').length;
    const publicationString = D.querySelector('[slot="date"]').textContent;

    /* related + sponsored */
    let related = [];
    try {
        debug("related videos to be looked at: %d", _.size(D.querySelectorAll('ytd-compact-video-renderer')));
        related = _.map(D.querySelectorAll('ytd-compact-video-renderer'), relatedMetadata);
    } catch(error) {
        throw new Error(`Unable to mine related: ${error.message}, ${error.stack.substr(0, 220)}...`);
    }

    let relatedN = D.querySelectorAll('ytd-compact-video-renderer').length;

    if(relatedN < 20) {
        debug("Because the related video are less than 20 (%d) trying the method2 of related extraction", relatedN);
        const f = D.querySelectorAll('[aria-label]')
        const selected = _.compact(_.map(f, function(e, i) {
            if(e.parentNode.parentNode.tagName != 'DIV' || e.parentNode.tagName != 'H3')
                return null;

            var t = e.parentNode.parentNode.parentNode.parentNode.querySelector("#thumbnail");

            if(t) {
                e.parentNode.parentNode.loaded = true;
                return e.parentNode.parentNode;
            }
            else {
                e.parentNode.parentNode.loaded = false;
                return null; 
                // può essere interessante tenere i video non ancora caricati, ma 
                // 'relatedMetadata' fallisce perchè i metadata sono ancora a zero.
                // 
                // questo altrimenti era funzionato:
                //
                // > _.countBy(selected, {loaded: true })
                // { true: 24, false: 25 }
                //  --- the videos not yet loaded but potentially suggested */
            }

        }));
        related = _.map(selected, relatedMetadata);
    }

    debug("Video %s mined %d related", title, _.size(related));

    /* non mandatory info */
    try {
        var viewInfo = parseViews(D);
        var likeInfo = parseLikes(D);
    } catch(error) {
        debug("viewInfo and linkInfo not available");
        var viewInfo = likeInfo = null;
    }

    return {
        title,
        check,
        ptc,
        publicationString,
        authorName,
        authorSource,
        related,
        relatedN,
        viewInfo,
        likeInfo
    };
};

function process(envelop) {

    if(!envelop.impression.href.match(/watch\?v=/)) {
        debug("TODO other pages filtering and mark them as 'non-watch'");
        return null;
    }

    const extracted = processVideo(envelop.jsdom);

    const re = _.filter(extracted.related, { error: true });
    stats.suberror += _.size(re);
    const ve = _.filter(extracted.viewInfo, { error: true });
    stats.suberror += _.size(ve);
    const le = _.filter(extracted.likeInfo, { error: true });
    stats.suberror += _.size(le);

    if(_.size(re)) errorrele("related error %s", JSON.stringify(re, undefined));
    if(_.size(ve)) errorview("views error %s", JSON.stringify(ve, undefined));
    if(_.size(le)) errorlike("likes error %s", JSON.stringify(re, undefined));

    /* remove debugging/research fields we don't want in mongo */
    _.unset(extracted, 'ptc');
    _.unset(extracted, 'check');
    return extracted;
};

function isVideo(envelop) {

    // this might have more metadata, but we just work without 
    const search = envelop.jsdom.querySelectorAll("h3.title-and-badge");
        debug("search? %d", _.size(search));

    debug("isVideo? %d (potential) titles", _.size(envelop.jsdom.querySelectorAll('h1 > yt-formatted-string')));
    const etit = envelop.jsdom.querySelector('h1 > yt-formatted-string');
    if(etit) {
        let vTitle = etit.textContent;
        if(_.size(vTitle) > 0)
            return envelop;

        debug("Because the title is empty, it is not a video!");
    }
    return false;
}

function videoAd(envelop) { 
    if ( envelop.impression.size == 58 ) {
        return null;
    }
    return { ad: envelop.jsdom.querySelector('.ytp-ad-text').textContent };
}
function overlay(envelop) { 
    if(
        (envelop.jsdom.querySelector('body').outerHTML).length == 71 &&
         envelop.impression.size == 58 ) {
        console.log(envelop.impression)
        return null;
    }

    const adbuyer = envelop.jsdom.querySelector('.ytp-ad-visit-advertiser-button').textContent;
    return {
        'advertiser': adbuyer
    }
}
function adTitleChannel(envelop) {
    const D = envelop.jsdom;
    const a = D.querySelectorAll('a');
    if(_.size(a) != 2)
        debug("Unexpected amount of element 'a' %d", _.size(a));

    return {
        adChannel: a[0].getAttribute('href'),
        adLabel: a[0].getAttribute('aria-label'),
    };
}

module.exports = {
    isVideo,
    process,
    videoAd,
    overlay,
    adTitleChannel,
};
