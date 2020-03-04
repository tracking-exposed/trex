#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:home');

const labelForcer = require('./video').labelForcer;

function dissectSelectedVideo(e) {
    const infos = {};

    try {
        infos.textTitle = e.querySelector('#video-title-link').textContent;
    } catch(error) {
        debug("Failure in textTitle: %s\n\t%s", error.message, e.querySelector("#video-title-link").innerHTML);
        infos.textTitle = '';
        infos.error = true;
    }
    try {
        infos.href = e.querySelector('a').getAttribute('href');
    } catch(error) {
        debug("Failure in href: %s\n\t%s", error.message, e.querySelector("a").innerHTML);
        infos.href = '';
        infos.error = true;
    }
    try {
        infos.authorName = e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent;
    } catch(error) {
        debug("Failure in authorName: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.authorName = '';
        infos.error = true;
    }
    try {
        infos.authorHref = e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href');
    } catch(error) {
        debug("Failure in authorHref: %s\n\t%s", error.message, e.querySelector('#text-container.ytd-channel-name').innerHTML);
        infos.authorHref = '';
        infos.error = true;
    }

    const aria = e.querySelector('#video-title-link').getAttribute('aria-label');
    const mined = labelForcer(aria);
    return _.merge(mined, infos, { aria });
}

function actualHomeProcess(D) {
    const ve = D.querySelectorAll('ytd-rich-item-renderer');
    debug("There are %d videos apparently", _.size(ve));
    const selected = _.map(ve, function(e, i) {
        try {
            let videoInfo = dissectSelectedVideo(e);
            videoInfo.order = i + 1;
            return videoInfo;
        } catch(error) {
            const f = e.querySelector('#video-title-link');
            const s = f ? f.getAttribute('aria-label') : null;
            debugger;
            return {
                order: i + 1,
                error: true,
                reason: error.message,
                aria: s,
            }
        }
    });
    debug("Processed homepage: %j", _.countBy(selected, { error: true }));
    return { selected };
}

function process(envelop) {

    let extracted = null;
    try {
        extracted = actualHomeProcess(envelop.jsdom);
    } catch(e) {
        debug("Error in processing %s (%d): %s",
            envelop.impression.href, envelop.impression.size, e.message);
        return null;
    }

    extracted.type = 'home';

    /* remove debugging/research fields we don't want in mongo */
    _.unset(extracted, 'ptc');
    _.unset(extracted, 'check');
    return extracted;
};

module.exports = {
    process,
};