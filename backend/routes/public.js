const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('routes:public');
const nconf = require('nconf');

const utils = require('../lib/utils');
const automo = require('../lib/automo');

// in regards of last metadata and by videoId
const PUBLIC_AMOUNT_ELEMS = 110;
const LAST_AMOUNT = 20;
const CACHE_SECONDS = 120;

const cache = {
    seconds: CACHE_SECONDS,
    content: null,
    computedAt: null,
    next: null,
};

function formatReturn(updated) {
    if(updated) {
        cache.content = updated.content;
        cache.computedAt = updated.computedAt;
        cache.next = updated.next
    }
    return {
        json: {
            content: cache.content,
            computedt: cache.computedAt.toISOString(),
            next: cache.next.toISOString(),
            cacheTimeSeconds: cache.seconds,
        }
    };
};


async function getLast(req) {

    const fields = ['watcher', 'title', 'viewInfo', 'savingTime',
                    'videoId', 'authorName', 'authorSource', 'likeInfo',
                    'publicationString', 'relatedN' ];

    if(_.isNull(cache.content) || (cache.next && moment().isAfter(cache.next)) ) {
        // if not initialized ^^^^ or if the cache time is expired: do the query
        const last = await automo.getMetadataByFilter({}, { amount: 20, skip: 0 });

        let freshContent = _.map(last, function(meta) {
            const retval = _.pick(meta, fields);
            retval.related = _.map(meta.related, function(e) {
                let rv = _.merge(e, e.mined);
                _.unset(rv, 'mined');
                _.unset(rv, 'longlabel');
                return rv;
            });
            const d = moment.duration( moment(retval.savingTime) - moment() );
            retval.timeago = d.humanize() + ' ago';
            retval.secondsago = d.asSeconds();
            return retval;
        });
        let cacheFormat = {
            content: _.reverse(_.orderBy(freshContent, 'secondsago')),
            computedAt: moment(),
            next: moment().add(cache.seconds, 'seconds')
        };
        return formatReturn(cacheFormat);
    }
    else {
        // cached
        return formatReturn();
    }

};

/*
    return Promise
        .resolve()
        .then(function() {
            if(cache.next && moment().isAfter(cache.next))
                return null;

            if(!cache.content)
                return null;

            return formatReturn();
        })
        .then(function(tbd) {
            if(tbd) return tbd;
            return mongo
                .readLimit(nconf.get('schema').metadata, {}, {savingTime: -1}, 20, 0)
                .map(contentClean)
                .then(function(x) {
                    let updated = {
                        content: _.reverse(_.orderBy(x, 'secondsago')),
                        computedAt: moment(),
                        next: moment().add(cache.seconds, 'seconds')
                    };
                    return formatReturn(updated);
                })
                .catch(function(error) {
                    debug("Error in getSequence: %s", error.message);
                    return { json: { error: true } };
                });
        })
};
*/

async function getVideoId(req) {
    debug("getVideoId %s", req.params.query);
    const entries = await automo.getMetadataByFilter({ videoId: req.params.query}, { amount: PUBLIC_AMOUNT_ELEMS, skip: 0 });
    const evidences = _.map(entries, function(meta) {
        meta.related = _.map(meta.related, function(e) {
            let rv = _.merge(e, e.mined);
            _.unset(rv, 'mined');
            _.unset(rv, 'longlabel');
            return rv;
        });
        _.unset(meta, '_id');
        return meta;
    });
    debug("getVideoId: found %d matches about %s", _.size(evidences), req.params.query);
    return { json: evidences };
};

async function getRelated(req) {
    debug("getRelated %s", req.params.query);
    const entries = await automo.getMetadataByFilter({ "related.videoId": req.params.query }, { amount: PUBLIC_AMOUNT_ELEMS, skip: 0});
    const evidences = _.map(entries, function(meta) {
        meta.related = _.map(meta.related, function(e) {
            return _.pick(e, ['title', 'source', 'index', 'videoId']);
        });
        meta.timeago = moment.duration( meta.savingTime - moment() ).humanize();
        _.unset(meta, '_id');
        return meta;
    });
    debug("getRelated: found %d matches about %s", _.size(evidences), req.params.query);
    return { json: evidences };
};


module.exports = {
    getLast,
    getVideoId,
    getRelated
};
