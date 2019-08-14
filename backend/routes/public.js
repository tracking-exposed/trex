const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:public');
const nconf = require('nconf');

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

function getVideoCSV(req) {
    const MAXENTRY = 400;
    const amount = _.parseInt(req.params.amount) ? _.parseInt(req.params.amount) : MAXENTRY;
    debug("getVideoCSV %s, amount %d", req.params.query, amount);
    return mongo
        .aggregate(nconf.get('schema').metadata, [
            { $match: { videoId: req.params.query } },
            { $sort: { savingTime: -1 }},
            { $limit : amount },
            { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
            { $unwind: '$related' }
        ]).map(function(r) {
            return {
                id: r.id,
                videoId: r.related.videoId,
                title: r.related.title,
                verified: r.related.verified,
                source: r.related.source,
                vizstr: r.related.vizstr,
                foryou: r.related.foryou,
                suggestionOrder: r.related.index,
                displayLength: r.related.displayTime,
                watched: r.title,
                since: r.publicationString,
                credited: r.authorName,
                channel: r.authorSource,
                savingTime: r.savingTime,
                watcher: r.watcher,
                watchedId: r.videoId,
            };
        })
        .then(personal.produceCSVv1)
        .then(function(csv) {
            debug("VideoCSV: produced %d bytes", _.size(csv));

            if(!_.size(csv))
                return { text: "Error, Zorry: 🤷" };

            return {
                headers: {
                    "Content-Type": "csv/text",
                    "content-disposition": "attachment; filename=video-"+ req.params.query+".csv"
                },
                text: csv,
            };
        });
};

module.exports = {
    getLast,
    getVideoId,
    getRelated,
    getVideoCSV,
};
