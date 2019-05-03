const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:documented');
const nconf = require('nconf');

/* it is retarded call this file 'documented' because are the only two
 * documented APIs in https://youtube.tracking.exposed/data, but, that is */

const mongo = require('./mongo');
const utils = require('./utils');

const cache = {
    seconds: 120,
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

function contentClean(i) {
    return _.map(i, function(video) {
        let retval = _.pick(video.metadata[0], ['watcher', 'title', 'viewInfo', 'savingTime',
            'videoId', "authorName", "authorSource", "likeInfo", "publicationString", 'relatedN'
        ]);
        retval.related = _.map(video.metadata[0].related, function(e) {
            let rv = _.merge(e, e.mined);
            _.unset(rv, 'mined');
            _.unset(rv, 'longlabel');
            return rv;
        });
        return retval;
    });
};

function getLast(req) {

    let ma = { $match: { processed: true } };
    let li = { $limit: 60 };
    let so = { $sort: { savingTime: -1 } };
    let lo = { $lookup: {
        from: 'metadata',
        localField: 'id',
        foreignField: 'id',
        as: 'metadata'
    } };

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
                .aggregate(nconf.get('schema').videos, [ ma, li, so, lo ])
                .then(function(x) {
                    debugger;
                    let updated = {
                        content: contentClean(x),
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

function getVideoId(req) {

    return mongo
        .readLimit(nconf.get('schema').metadata, { videoId: req.params.query }, {}, 110, 0)
        .map(function(meta) {
            let clean = _.map(meta.related, function(e) {
                let rv = _.merge(e, e.mined);
                _.unset(rv, 'mined');
                _.unset(rv, 'longlabel');
                return rv;
            });
            meta.related = clean;
            _.unset(meta, '_id');
            return meta;
        })
        .then(function(evidences) {
            debug("getVideoId: found %d matches about %s", _.size(evidences), req.params.query);
            return { json: evidences };
        });
};

function getRelated(req) {
    return mongo
        .readLimit(nconf.get('schema').metadata, { "related.videoId": req.params.query }, {}, 110, 0)
        .map(function(meta) {
            let clean = _.map(meta.related, function(e) {
                return _.pick(e, ['title', 'source', 'index', 'videoId']);
            });
            meta.related = clean;
            _.unset(meta, '_id');
            return meta;
        })
        .then(function(evidences) {
            debug("getRelated: found %d matches about %s", _.size(evidences), req.params.query);
            return { json: evidences };
        });
};

module.exports = {
    getLast,
    getVideoId,
    getRelated
};
