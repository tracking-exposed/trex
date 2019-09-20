const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');

async function getPersonal(req) {

    const DEFMAX = 40;
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
    debug("getPersonal: amount %d skip %d, default max %d", amount, skip, DEFMAX);

    const data = await automo.getMetadataByPublicKey(k, { amount, skip });

    let recent = _.map(data.metadata, function(m) {
        let r = _.omit(m, ['_id']);
        r.related = _.map(r.related, function(entry) { return _.omit(entry, ['mined']); });
        r.relative = moment.duration( moment(m.savingTime) - moment() ).humanize() + " ago";
        return r;
    });

    return { json: {
        profile: _.omit(data.supporter, ['_id']),
        recent,
    } };
};

async function getPersonalCSV(req) {

    const CSV_MAX_SIZE = 1000;
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const data = await automo.getMetadataByPublicKey(k, { amount: CSV_MAX_SIZE, skip: 0 });
    const csv = CSV.produceCSVv1(data);

    debug("getPersonalCSV produced %d bytes from %d entries (max %d)",
        _.size(csv), _.size(data), CSV_MAX_SIZE);

    if(!_.size(csv))
        return { text: "Error, Zorry: 🤷" };

    return {
        headers: {
            "Content-Type": "csv/text",
            "content-disposition": "attachment; filename=personal-yttrex.csv"
        },
        text: csv,
    };
};

async function getPersonalRelated(req) {

    const DEFMAX = 40;
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
    debug("getPersonalRelated request by %s using %d starting videos, skip %d (defmax %d)", k, amount, skip, DEFMAX);
    let related = await automo.getRelatedByWatcher(k, { amount, skip });
    const formatted = _.map(related, function(r) {
        /* this is the same format in youtube.tracking.exposed/data,u
         * and should be in lib + documented */
        return {
            id: r.id,
            videoId: r.related.videoId,
            title: r.related.title,
            source: _.replace(r.related.source, /\n/g, ' ⁞ '),
            vizstr: r.related.vizstr,
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
    });

    debug("getPersonalRelated produced %d results", _.size(formatted));
    return {
        json: formatted
    };
};

module.exports = {
    getPersonal,
    getPersonalCSV,
    getPersonalRelated,
};
