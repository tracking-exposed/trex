#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:home');

const labelForcer = require('./video').labelForcer;

function dissectSelectedVideo(e) {
    const aria = e.querySelector('#video-title-link').getAttribute('aria-label');
    const infos = labelForcer(aria);
    infos.textTitle = e.querySelector('#video-title-link').textContent;
    infos.href = e.querySelector('a').getAttribute('href');
    infos.aria = aria;
    infos.authorName = e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent;
    infos.authorHref = e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href');
    return infos;
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
                textTitle: e.querySelector('a#video-title-link').textContent,
                href: e.querySelector('a#video-title-link').getAttribute('href'),
                authorName: e.querySelector('#text-container.ytd-channel-name').querySelector('a').textContent,
                authorHref: e.querySelector('#text-container.ytd-channel-name').querySelector('a').getAttribute('href'),
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