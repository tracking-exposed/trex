const _ = require('lodash');
const debug = require('debug')('parser:shared');
const debuge = require('debug')('parser:shared:error');
const url = require('url');

/* shared functions used from video and home */

function getThumbNailHref(e) {
    // e is an 'element' from .querySelectorAll('ytd-compact-video-renderer')
    let thumbnailHref = null;
    try {
        const refe = e.querySelector('.ytd-thumbnail-overlay-time-status-renderer');
        if(!refe)
            return null;

        const thumbnailSrc = refe.closest('a').querySelector('img').getAttribute('src');
        if(!thumbnailSrc)
            return null;

        const c = url.parse(thumbnailSrc);
        thumbnailHref = 'https://' + c.host + c.pathname;
    } catch(e) {
        debuge("thumbnail mining error: %s", e.message);
    }
    return thumbnailHref;
}

function logged(D) {
    const avatarN = D.querySelectorAll('button#avatar-btn');
    const loginN = D.querySelectorAll('[href^="https://accounts.google.com/ServiceLogin"]');
    const avalen = avatarN ? avatarN.length : 0;
    const logilen = loginN ? loginN.length : 0;

    // login button | avatar button len
    if(logilen && !avalen)
        return false;
    if(avalen && !logilen)
        return true; 

    debug("Inconsistent condition avatar %d login %d", avalen, logilen);
    return null;
}

function fixHumanizedTime(inputstr) {
    // this function fix the time 0:10, 10:10,  in HH:MM:SS
    if(inputstr.length == 4)
        return '0:0' + inputstr;
    if(inputstr.length == 5)
        return '0:' + inputstr;
    if(inputstr.length >= 9)
        debug("Warning this is weird in fixHumanizedTime: %s", inputstr);
    return inputstr;
}

module.exports = {
    getThumbNailHref,
    logged,
    fixHumanizedTime,
};
