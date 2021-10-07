const _ = require('lodash');
const nconf = require("nconf");
const debug = require('debug')('parser:video');
const assertmsg = require('debug')('parser:video:assert');
const moment = require('moment');

const shared = require('./shared');

function assert(condition, message) {
    if(!condition)
        assertmsg(message);
}

function testAttributes(alist, e) {
    const attempts = _.compact(_.map(alist, function(attr) {
        try {
            return e.querySelector("["+attr+"]").getAttribute(attr);
        } catch(error) {
            return null;
        }
    }));
    if(attempts.length === 0 ) { debug("Failure with testAttemps"); console.log(e.outerHTML); return null; }
    else if(attempts.length === 1) { return _.first(attempts); }
    else {
        if(attempts[0] != attempts[1])
            debug("weird inconsistency testAttr! %s %s", attempts[0], attempts[1]);
        return _.first(attempts);
    }
}

function testText(slist, e) {
    const attempts = _.compact(_.map(slist, function(selector) {
        try {
            e.querySelector(selector).textContent;
        } catch(error) {
            return null;
        }
    }));
    if(attempts.length === 0 ) { return null; }
    else if(attempts.length === 1) { return _.first(attempts); }
    else {
        if(attempts[0] != attempts[1])
            debug("weird inconsistency testText! %s %s", attempts[0], attempts[1]);
        return _.first(attempts);
    }
}

/* not shared yet until is not really sure we need it, like
   dissectV in shared.js can't be reused and might be moved in home.js 
   
   this might work also in categories like /categories/babe
   */
function videoBlockMeta(e, i) {
    const orientation = e.getAttribute('data-segment'); // straight mostly
    const videoId = e.getAttribute('data-video-vkey');
    const expectedA = e.querySelectorAll('a');
    assert(expectedA.length === 3, "Expected three <a> in a videoBlock");
    const authorLink = _.last(expectedA).getAttribute('href');
    const authorName = _.last(expectedA).textContent;
    const title = expectedA[1].getAttribute('title');
    const thumbaddr = testAttributes([
        "data-src", "data-thumb_url", "data-mediumthumb"
    ], e);
    const duration = e.querySelector('.duration').textContent.trim();
    const fixedDuration = shared.fixHumanizedTime(duration);
    const durationSeconds = moment.duration(fixedDuration).asSeconds();
    const viewstr = testText([".views", ".views > var"], e);
    const views = viewstr ? shared.unitParse(viewstr) : -1;
    const price = e.querySelector('.price') ? e.querySelector('.price').textContent : null;
    const valuestr = e.querySelector('.value');
    const value = _.parseInt(valuestr);

    return {
        videoId,
        orientation,
        authorLink,
        authorName,
        title,
        thumbaddr,
        durationSeconds,
        duration,
        views,
        value,
        price,
        order: i
    }
}

function video(envelop, previous) {

    if(previous.nature.type !== 'video') return false;

    /* as first we've to get if the 'h1' is a title or an error message */
    const title = envelop.jsdom.querySelector('div > h1');

    if(!title) {
        debug("Video page without a title!?");
        return false;
    }

    const hasClass = title.parentNode.getAttribute('class');
    if(!hasClass) {
        /* this video landed on a removed page or a wrong typed pornhub id */
        return {
            error: true,
            message: title.textContent,
        };
    }

    /* this apply both to the video below and also the one on the right column */
    const vb = envelop.jsdom.querySelectorAll('li.videoBlock');
    const related = _.map(Array.from(vb), videoBlockMeta)
    const titleString = title.textContent.trim();
    const sidekind = envelop.jsdom.querySelector('.section_bar_sidebar').textContent.trim();

    return {
        title: titleString,
        sidekind,
        categories: shared.getCategories(envelop.jsdom),
        related,
    }
};


module.exports = video;
