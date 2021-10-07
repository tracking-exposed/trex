const _ = require('lodash');
const debug = require('debug')('parser:search');

const shared = require('./shared');

function search(envelop, previous) {

    if(previous.nature.type !== "search")
        return false;

    if(envelop.jsdom.querySelector("#noResultBigText")) {
        /* if videos are present, means no actual results,
         * if zero video are present, means banned keyword */
        const check = [];
        try {
            check = shared.getFeatured(envelop.jsdom);
        } catch(error) {
            // debug("No video returned in 'no results' page, possible banned query: %s", envelop.html.href);
        }

        const retval = { results: []};
        retval.reason = check.length ?
            "no results for this query" : "banned query";
        return retval;
    }

    let retval = shared.getFeatured(envelop.jsdom);
    let counter;
    try {
        counter = envelop.jsdom.querySelector(".showingCounter").textContent.trim();
    } catch(error) {
        counter = "none";
    }
    return { results: retval, reason: counter };
};

module.exports = search;