const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:documented');
const nconf = require('nconf');

const personal = require('./personal');

/* it is retarded call this file 'documented' because are the only two
 * documented APIs in https://youtube.tracking.exposed/data, but, that is */

const mongo = require('./mongo');

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

function contentClean(meta) {
    let retval = _.pick(meta, ['watcher', 'title', 'viewInfo', 'savingTime',
        'videoId', "authorName", "authorSource", "likeInfo", "publicationString", 'relatedN'
    ]);
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
};

function getLast(req) {

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

function getVideoId(req) {
    debug("getVideoId %s", req.params.query);
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
    debug("getRelated %s", req.params.query);
    return mongo
        .readLimit(nconf.get('schema').metadata, { "related.videoId": req.params.query }, {}, 110, 0)
        .map(function(meta) {
            let clean = _.map(meta.related, function(e) {
                return _.pick(e, ['title', 'source', 'index', 'videoId']);
            });
            meta.related = clean;
            meta.timeago = moment.duration( meta.savingTime - moment() ).humanize();
            _.unset(meta, '_id');
            return meta;
        })
        .then(function(evidences) {
            debug("getRelated: found %d matches about %s", _.size(evidences), req.params.query);
            return { json: evidences };
        });
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
        .map(special)
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

function special(entry) {
    const people = {
        'corn-blueberry-souffle': "french",
        'lime-okra-prune': "korean",
        'custard-succotash-souffle':  "french",
        'cinnamon-shawarma-muffin': "french",
        'orzo-tangelo-sage':"korean",
        'garbanzo-macaroon-blueberry': "korean",
        'muffin-eggs-kebab': "french",
        'milk-eggs-berry':  "french",
        'papaya-rhubarb-cake': "korean",
        'cinnamon-sandwich-feta': "jeroen",
        'cranberry-asparagus-shawarma': "korean",
        'leek-endive-okra': "french",
    };
    let exists = _.get(people, entry.watcher);
    if(exists)
        entry.team = exists;

    return entry;
};

module.exports = {
    getLast,
    getVideoId,
    getRelated,
    getVideoCSV,
};
