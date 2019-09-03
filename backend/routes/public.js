const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:public');
const nconf = require('nconf');

const params = require('../lib/params');
const automo = require('../lib/automo');
const CSV = require('../lib/CSV');

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

    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);

    if(_.isNull(cache.content) || (cache.next && moment().isAfter(cache.next)) ) {
        // if not initialized ^^^^ or if the cache time is expired: do the query
        const last = await automo.getMetadataByFilter({}, { amount, skip });

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
        _.unset(meta, '_id');
        return meta;
    });
    debug("getVideoId: found %d matches about %s", _.size(evidences), req.params.query);
    return { json: evidences };
};

async function getRelated(req) {
    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getRelated %s looks into all the video, amount %d skip %d", req.params.query, amount, skip);
    const entries = await automo.getMetadataByFilter({ "related.videoId": req.params.query }, { amount, skip});
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

async function getVideoCSV(req) {
    const MAXENTRY = 800;
    const { amount, skip } = params.optionParsing(req.params.paging, MAXENTRY);
    debug("getVideoCSV %s, amount %d skip %d (default %d)", req.params.query, amount, skip, MAXENTRY);
    const byrelated = await automo.getRelatedByVideoId(req.params.query, { amount, skip} );
    const csv = CSV.produceCSVv1(byrelated);
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
};

async function getByAuthor(req) {
    const { amount, skip } = params.optionParsing(req.params.paging, PUBLIC_AMOUNT_ELEMS);
    debug("getByAuthor %s amount %d skip %d", req.params.query, amount, skip);
    const byauthor = await automo.getMetadataByFilter({ authorName: req.params.query }, { amount, skip});
    debug("getByAuthor returns %d", _.size(byauthor));

    const publicFields = ['id', 'title', 'savingTime', 'videoId',
        'linkinfo', 'viewInfo', 'related', 'authorName',
        'authorSource', 'publicationString' ];

    const clean = _.map(byauthor, function(e) {
        e.id = e['id'].substr(0, 20);
        return _.pick(e, publicFields)
    });
    return { json: clean };
};

module.exports = {
    getLast,
    getVideoId,
    getRelated,
    getVideoCSV,
    getByAuthor,
};
