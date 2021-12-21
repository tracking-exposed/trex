const _ = require('lodash');
const debug = require('debug')('lib:cache');
const moment = require('moment');

/* API last return a summary of last activities */
const LAST_CACHE = 600;
/* all the other cache 'names' have 1800 seconds */
const STATS_CACHE = 1800;
const allowedNames = ['supporters', 'active', 'related',
    'processing', 'metadata', 'usage', 'searches',
    'labels', 'deeper', 'ads', 'ytvids', 'recommendations',
    'leaves', 'creators' ];

const cache = {
    'last': {
        seconds: LAST_CACHE
    }
};

function validSubject (sbj) {
    return (
        _.concat(_.keys(cache), allowedNames)
        .indexOf(sbj) !== -1
    );
}

function repullCache (subject) {
    if (!validSubject(subject)) { throw new Error('Invalid subject' + subject); }

    debug('returning cached copy of [%s] duplicated evidences', subject);
    return cache[subject];
}

function stillValid (subject) {
    if (!validSubject(subject)) { throw new Error('Invalid subject' + subject); }

    return (cache[subject] &&
        cache[subject].content &&
        cache[subject].next &&
        moment().isAfter(cache[subject].next)
    );
}

function setCache (subject, content) {
    if (!validSubject(subject)) { throw new Error('Invalid subject ' + subject); }

    if (!cache[subject]) { cache[subject] = { seconds: STATS_CACHE }; }

    cache[subject].content = content;
    cache[subject].computedAt = moment();
    cache[subject].next = moment().add(cache.seconds, 'seconds');

    return cache[subject];
}

module.exports = {
    allowedNames,
    validSubject,
    repullCache,
    stillValid,
    setCache
};
