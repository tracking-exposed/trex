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
    try {
        const viewStr = node.innerHTML
        let tmp = _.first(viewStr.split(' '))
        const viewNumber = _.parseInt(tmp.replace(/[.,]/g, ''));
        return { viewStr: viewStr, viewNumber: viewNumber };
    } catch(error) {
        errorview("(%s): %s", node.innerHTML, error);
        return {
            error: true,
            source: node.innerHTML
        };
    }
};

function parseLikes(D) {
    const nodes = D.querySelectorAll('.ytd-toggle-button-renderer > yt-formatted-string');
    try {
        const likes = nodes[0].getAttribute('aria-label');
        const dislikes = nodes[1].getAttribute('aria-label');
        return { likes: likes, dislikes: dislikes };
    } catch(error) {
        /* expected two elements in nodes */
        errorlike("(%d) %s", _.size(nodes), error);
        return {
            error: true,
            source: [ nodes[0].outerHTML, nodes[1].outerHTML ]
        }
    }
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

    let source, vizstr;
    const title = e.querySelector('#video-title').textContent;
    const metadata = e.querySelector('#metadata');

    if(metadata.children.length > 0)
        source = metadata.children[0].textContent;
    if(metadata.children.length > 1)
        vizstr = metadata.children[1].textContent;

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

    const foryou = vizstr.match(/\d+/) ? false : true;
    const mined = labelForcer(longlabel);
    return {
        index: i + 1,
        title,
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

function processVideo(D) {

    const etit = D.querySelector('h1 > yt-formatted-string ');
    if(!etit) {
        throw new Error("unable to get title (1)");
    }

    const vTitle = etit.textContent;
    if(!vTitle || _.size(vTitle) < 0) {
        throw new Error("unable to get title (2)");
    }

    const check = D.querySelectorAll('a.ytd-video-owner-renderer').length; // should be 1
    const authorName = D.querySelector('a.ytd-video-owner-renderer').getAttribute('aria-label');
    const authorSource = D.querySelector('a.ytd-video-owner-renderer').getAttribute('href');
    const ptc =D.querySelectorAll('[slot="date"]').length;
    const publicationString = D.querySelector('[slot="date"]').textContent;

    /* non mandatory info */
    const viewInfo = parseViews(D);
    const likeInfo = parseLikes(D);

    /* related + sponsored */
    let related = [];
    try {
        related = _.map(D.querySelectorAll('ytd-compact-video-renderer'), relatedMetadata);
    } catch(error) {
        debug("Error in related: %s", error.message);
    }
    const relatedN = D.querySelectorAll('ytd-compact-video-renderer').length;

    return {
        title: vTitle,
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

module.exports = {
    isVideo: isVideo,
    process: process
};
