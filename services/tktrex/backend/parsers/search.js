const _ = require('lodash');
const debug = require('debug')('parser:search');

const getNatureByHref = require('./shared').getNatureByHref;

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
function search(envelop, previous) {

    if(previous.nature.type !== "search")
        return false;

    const vlink = envelop.jsdom.querySelector('a[href^="https://www.tiktok.com/@"]');
    const noRes = envelop.jsdom.querySelector("#noResultBigText");
    const relatedS = envelop.jsdom.querySelector('.relatedSearchTermsBottom');
    const bigE = envelop.jsdom.querySelector('h2');
    const img = envelop.jsdom.querySelector('img');
    const video = envelop.jsdom.querySelector('video');

    const retval = {};

    if(vlink) {
        const linkSelected = vlink.getAttribute('href');
        const pna = getNatureByHref(linkSelected);
        retval.selected = pna;
        _.unset(retval.selected, 'authorId');
        _.unset(retval.selected, 'type');
        retval.selected.href = linkSelected;
    }

    if(vlink && img)
        retval.selected.thumbnail = img.getAttribute('src');

    if(vlink && video)
        retval.selected.video = video.getAttribute('src');

    if(bigE)
        retval.warning = bigE.parentNode.textContent();

    debug("%o --- %s --- %s",
        retval,
        noRes ? noRes.textContent : "!noResultBitText",
        relatedS ? relatedS.textContent : "!relatedS"
    );
    return retval;
};

module.exports = search;