const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:public');

const params = require('../lib/params');
const automo = require('../lib/automo');
const CSV = require('../lib/CSV');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 110;
// This is in regards of the 'last' API cache, (which might be discontinued?)
const CACHE_SECONDS = 600;

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

    const amount = 7;
    const skip = _.random(10, 30);

    if(_.isNull(cache.content) || (cache.next && moment().isAfter(cache.next)) ) {
        // if not initialized ^^^^ or if the cache time is expired: do the query
        const last = await automo.getMetadataByFilter({
            title: { $exists: true },
            relatedN: { $gt: 10 },
            videoId: { $exists: true }
        }, { amount, skip });

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
        debug("Returning %d new random videos %j, which become part of a %d minutes long cache",
            amount, _.map(freshContent, 'title'), CACHE_SECONDS / 60);
        return formatReturn(cacheFormat);
    }
    else {
        debug("Returning %d cached random videos", amount)
        return formatReturn();
    }
};

async function getVideoId(req) {
    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getVideoId %s amount %d skip %d default %d",
        req.params.query, amount, skip, PUBLIC_AMOUNT_ELEMS);

    const entries = await automo.getMetadataByFilter({ videoId: req.params.query}, { amount, skip });
    const evidences = _.map(entries, function(meta) {
        meta.related = _.map(meta.related, function(e) {
            let rv = _.merge(e, e.mined);
            _.unset(rv, 'mined');
            _.unset(rv, 'longlabel');
            return rv;
        });
        meta.related = _.reverse(meta.related);
        _.unset(meta, '_id');
        return meta;
    });
    debug("getVideoId: found %d matches about %s", _.size(evidences), req.params.query);
    return { json: evidences };
};

async function getRelated(req) {
    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getRelated %s query directly 'related.videoId'. amount %d skip %d", req.params.query, amount, skip);
    const entries = await automo.getMetadataByFilter({ "related.videoId": req.params.query }, { amount, skip});
    const evidences = _.map(entries, function(meta) {
        meta.related = _.map(meta.related, function(e) {
            return _.pick(e, ['title', 'source', 'index', 'foryou', 'videoId']);
        });
        meta.timeago = moment.duration( meta.savingTime - moment() ).humanize();
        _.unset(meta, '_id');
        return meta;
    });
    debug("getRelated: returning %d matches about %s", _.size(evidences), req.params.query);
    return { json: evidences };
};

async function getVideoCSV(req) {
    // /api/v1/videoCSV/:query/:amount
    const MAXENTRY = 2800;
    const { amount, skip } = params.optionParsing(req.params.paging, MAXENTRY);
    debug("getVideoCSV %s, amount %d skip %d (default %d)", req.params.query, amount, skip, MAXENTRY);
    const byrelated = await automo.getRelatedByVideoId(req.params.query, { amount, skip} );
    const csv = CSV.produceCSVv1(byrelated);
    const filename = 'video-' + req.params.query + "-" + moment().format("YY-MM-DD") + ".csv"
    debug("VideoCSV: produced %d bytes, returning %s", _.size(csv), filename);

    if(!_.size(csv))
        return { text: "Error, Zorry: 🤷" };

    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
};

async function getByAuthor(req) {
    /* this API do not return the standard format with videos and related inside,
     * but a data format ready for the visualization provided - this has been 
     * temporarly suspended: https://github.com/tracking-exposed/youtube.tracking.exposed/issues/18 */

    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getByAuthor %s amount %d skip %d", req.params.query, amount, skip);

    let authorStruct;
    try {
        authorStruct = await automo.getMetadataFromAuthor({
            videoId: req.params.query
        }, { amount, skip});
    } catch(e) {
        debug("getByAuthor error: %s", e.message);
        return {
            json: {
                error: true,
                message: e.message
            }
        }
    }

    const authorName = authorStruct.authorName;
    debug("getByAuthor returns %d elements from %s",
        _.size(authorStruct.content), authorName);

    const publicFields = ['id', 'title', 'savingTime', 'videoId', 'linkinfo',
        'viewInfo', 'related', 'authorName', 'authorSource', 'publicationString' ];

    const clean = _.map(authorStruct.content, function(e) {
        // id is anonymized in this way, and is still an useful unique id
        e.id = e['id'].substr(0, 20);
        return _.pick(e, publicFields)
    });

    /* first step is separate the three categories and merge infos */
    const sameAuthor = _.map(clean, function(video) {
        return _.map(_.filter(video.related, { source: authorName }), function(r) {
            return {
                watchedTitle: video.title,
                id: video.id + r.videoId,
                savingTime: video.savingTime,
                watchedVideoId: video.videoId,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
            }
        });
    });

    const foryou = _.map(clean, function(video) {
        return _.map(_.filter(video.related, { foryou: true }), function(r) {
            return {
                watchedTitle: video.title,
                id: video.id + r.videoId,
                savingTime: video.savingTime,
                watchedVideoId: video.videoId,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
                relatedAuthorName: authorName,
            }
        });
    });

    const treasure = _.map(clean, function(video) {
        debug("byAuthor quick check ø SA %d FY %d T %d (total %d)", 
            _.size(_.filter(video.related, { source: authorName })),
            _.size(_.filter(video.related, { foryou: true })),
            _.size( _.reject( _.reject(video.related, { source: authorName }), { foryou: true })),
            _.size(clean)
        );
        return _.map( _.reject( _.reject(video.related, { source: authorName }), { foryou: true }), function(r) { 
            return {
                id: video.id + r.videoId,
                watchedTitle: video.title,
                watchedVideoId: video.videoId,
                savingTime: video.savingTime,
                relatedVideoId: r.videoId,
                relatedTitle: r.title,
                relatedAuthorName: authorName,
            }
        });
    })

    /* second step to filter them by time (if needed) */
    /* and filter the fields */

    /* this step is group and count */
    const csa = _.groupBy(_.flatten(sameAuthor), 'relatedVideoId');
    const cfy = _.groupBy(_.flatten(foryou), 'relatedVideoId');
    const ct = _.groupBy(_.flatten(treasure), 'relatedVideoId');

    const reduced = {
        sameAuthor: csa,
        foryou: cfy,
        treasure: ct,
    };

    debug("byAuthor [%s], %d evidences, returning %d bytes instead of %d", 
        authorName,
        _.size(authorStruct.content),
        _.size(JSON.stringify(reduced)),
        _.size(JSON.stringify(authorStruct.content))
    );

    return { json: {
        authorName,
        content: reduced,
        authorSource: authorStruct.authorSource,
        paging: authorStruct.paging,
        total: authorStruct.total,
    }};
};


module.exports = {
    getLast,
    getVideoId,
    getRelated,
    getVideoCSV,
    getByAuthor,
};
