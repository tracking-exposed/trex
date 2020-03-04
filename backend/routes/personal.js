const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

async function getPersonal(req) {
    const DEFMAX = 10;
    const k =  req.params.publicKey;
    if(_.size(k) < 16)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
    debug("getPersonal: amount %d skip %d, default max %d", amount, skip, DEFMAX);

    let data = null;
    try {
        data = await automo.getSummaryByPublicKey(k, { amount, skip });
    } catch(e) {
        console.log(e);
        debug("Catch exception in getSummaryByPublicKey: %s", e.message);
        return { json: { "message": e.message, "error": true }};
    }

    /* data should contain '.graphs', '.total', '.supporter', '.recent' */
    if(data.error)
        return { json: { "message": data.message, "error": true }};

    data.request = {
        amount,
        skip,
        when: moment().toISOString()
    }
    return { json: data };
};

async function getPersonalCSV(req) {
    const CSV_MAX_SIZE = 1000;
    let evidenceCounter = 0;
    let lastSeenEvidence = null;
    const k =  req.params.publicKey;

    const data = await automo.getMetadataByPublicKey(k, { amount: CSV_MAX_SIZE, skip: 0 });
    const unwinded = _.reduce(data.metadata, function(memo, evidence) {

        if(evidence.id != lastSeenEvidence) {
            lastSeenEvidence = evidence.id;
            evidenceCounter++;
        }

        let exprelated = _.map(evidence.related, function(related, i) {
            if(i >= 20)
                return null;

            return {
                savingTime: evidence.savingTime,
                watcher: data.supporter.p,
                id: i + 'x' + evidence.id,
                evidence: evidenceCounter,

                recommendedVideoId: related.videoId,
                recommendedViews: (related.mined) ? related.mined.viz : null,
                recommendedDuration: (related.mined) ? related.mined.duration : null,
                recommendedPubtime: (related.mined) ? related.mined.timeago : null,
                recommendedForYou: related.foryou,
                recommendedTitle: related.title,
                recommendedAuthor: related.source,
                recommendedVerified: related.verified,
                recommendationOrder: related.index,
                watchedId: evidence.id,
                watchedAuthor: evidence.authorName,
                watchedPubtime: evidence.related.vizstr,
                watchedTitle: evidence.title,
                watchedViews: evidence.viewInfo.viewStr ? evidence.viewInfo.viewStr : null,
                watchedChannel: evidence.authorSource,
            };
        })
        memo = _.concat(memo, _.compact(exprelated));
        return memo;
    }, []);
    debug("data %d -> unwinded %d", _.size(data.metadata), _.size(unwinded));
    const csv = CSV.produceCSVv1(unwinded);

    debug("getPersonalCSV produced %d bytes from %d entries (max %d)",
        _.size(csv), _.size(data.metadata), CSV_MAX_SIZE);

    if(!_.size(csv))
        return { text: "Error 🤷 No content produced in this CSV!" };

    const filename = 'personal-yttrex-copy-' + moment().format("YY-MM-DD") + ".csv"
    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
};

async function getPersonalTimeline(req) {
    const DEFMAX = 1000;
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
    debug("getPersonalTimelines request by %s using %d starting videos, skip %d (defmax %d)", k, amount, skip, DEFMAX);
    let c = await automo.getMetadataByPublicKey(k, { takefull:true, amount, skip });

    const list = _.map(c.metadata, function(e) {
        e.value = utils.hash(e, _.keys(_.pick(e, ['ad', 'title', 'authorName'])));
        e.dayString = moment(e.savingTime).format("YYYY-MM-DD");
        console.log( e.value, _.keys(_.pick(e, ['ad', 'title', 'authorName'])),
            _.pick(e, ['ad', 'title', 'authorName']) );
        e.numb = _.parseInt(_.replace(e.value, '/\(c+)/', ''));
        return e;
    });
    debug("getPersonalTimelines transforming %d last %s ", _.size(list), 
        ( _.first(list) ? _.first(list).title : "[nothing]" )  );

    const grouped = _.groupBy(list, 'dayString');
    debugger;
    const aggregated = _.map(grouped, function(perDayEvs, dayStr) {
        debugger;
        return {
            dayStr,

        }
    })
    return { json: list };
}

async function getPersonalRelated(req) {
    const DEFMAX = 40;
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
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

async function getEvidences(req) {
    /* this function is quite generic and flexible. allow an user to query their
     * own evidences and allow specification of which is the field to be queried.
     * It is used in our interface with 'id' */
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const allowFields = ['tagId', 'id', 'videoId'];
    const targetKey = req.params.key;
    const targetValue = req.params.value;

    if(allowFields.indexOf(targetKey) == -1)
        return { json: { "message": `Key ${targetKey} not allowed (${allowFields})`, error: true }};

    const matches = await automo.getVideosByPublicKey(k, _.set({}, targetKey, targetValue));
    debug("getEvidences with flexible filter found %d matches", _.size(matches));
    return { json: matches };
};

async function removeEvidence(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const id = req.params.id;
    const result = await automo.deleteEntry(k, id);
    return { json: { success: true, result }};
};


module.exports = {
    getPersonal,
    getPersonalCSV,
    getPersonalTimeline,
    getPersonalRelated,
    getEvidences,
    removeEvidence,
};
