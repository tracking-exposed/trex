const _ = require('lodash');
const debug = require('debug')('lib:cache');
const moment = require('moment');

const CACHE_SECONDS = 600;

const cache = {
    'last': {
        seconds: CACHE_SECONDS,
        content: null,
        computedAt: null,
        next: null,
    },
};

function validSubject(sbj) {
    return (_.keys(cache).indexOf(sbj) !== -1);
}

function repullCache(subject) {

    if(!validSubject(subject))
        throw new Error("Invalid subject" + subject);

    debug("returning cached copy of last duplicated evidences");
    return cache[subject];
}

function stillValid(subject) {

    if(!validSubject(subject))
        throw new Error("Invalid subject" + subject);

    return ( cache[subject].content &&
        cache[subject].next &&
        moment().isAfter(cache[subject].next)
    );
}

function setCache(subject, content) {

    if(!validSubject(subject))
        throw new Error("Invalid subject" + subject);

    cache[subject].content = content;
    cache[subject].computedAt = moment();
    cache[subject].next = moment().add(cache.seconds, 'seconds');

    return cache[subject];
}

module.exports = {
    validSubject,
    repullCache,
    stillValid,
    setCache,
}
