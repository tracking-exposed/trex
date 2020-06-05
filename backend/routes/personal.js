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
        const d = moment.duration( moment(data.supporter.lastActivity) - moment(data.supporter.creationTime) )
        data.supporter.hereSince = d.humanize();
        debug("Returning %d videos of %d from a profile hereSince %s",
            _.size(data.recent), data.total, data.supporter.hereSince);
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
    /* this function might return a CSV containing all the video in the homepages, 
     * or all the related video. depends on the parameter */

    const CSV_MAX_SIZE = 1000;
    let sourceCounter = 0;
    const k =  req.params.publicKey;
    const type = req.params.type;

    if(['home', 'video'].indexOf(type) == -1 ) 
        return { text: "Error 🤷 Invalid request, only 'video' or 'home' are supported" };

    const data = await automo.getMetadataByPublicKey(k, { amount: CSV_MAX_SIZE, skip: 0, typefilter: type });
    /* this return of videos or homepage, they generated slightly different CSV formats */

    sourceCounter = _.size(data.metadata);
    let unrolled;

    if(type == 'home')
        unrolled = _.reduce(data.metadata, CSV.unwindSections, []);
    else
        unrolled = _.reduce(data.metadata, CSV.unrollRecommended, []);

    const ready = _.map(unrolled, function(e) {
        _.unset(e, 'publickey');
        return e;
    });

    debug("data were %d now unrolling each evidence %d", sourceCounter, _.size(ready));
    const csv = CSV.produceCSVv1(ready);
    debug("getPersonalCSV produced %d bytes, with CSV_MAX_SIZE %d", _.size(csv), CSV_MAX_SIZE);

    if(!_.size(csv))
        return { text: "Error 🤷 No content produced in this CSV!" };

    const filename = 'personal-' + type + '-yttrex-' + moment().format("YY-MM-DD") + '-' + sourceCounter + ".csv";
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
        /* console.log( e.value, _.keys(_.pick(e, ['ad', 'title', 'authorName'])),
            _.pick(e, ['ad', 'title', 'authorName']) ); */
        e.value = utils.hash(e, _.keys(_.pick(e, ['ad', 'title', 'authorName'])));
        e.dayString = moment(e.savingTime).format("YYYY-MM-DD");
        e.numb = _.parseInt(_.replace(e.value, '/\(c+)/', ''));
        return e;
    });
    debug("getPersonalTimelines transforming %d last %s ", _.size(list), 
        ( _.first(list) ? _.first(list).title : "[nothing]" )  );

    const grouped = _.groupBy(list, 'dayString');
    const aggregated = _.map(grouped, function(perDayEvs, dayStr) {
        let videos = _.size(_.filter(perDayEvs, { 'type': 'video' }));
        let homepages = _.size(_.filter(perDayEvs, { 'type': 'home' }));
        let types = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'type'), ['undefined']), function(amount, name) { return amount; }));
        let authors = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'authorName'), ['undefined']), function(amount, name) { return amount; }));
        let adverts = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'advertiser'), ['undefined']), function(amount, name) { return amount; }));
        debug("V%d H%d | %j %d - %j %d - %j %d",
            videos, homepages,
            _.countBy(perDayEvs, 'type'), types,
            _.countBy(perDayEvs, 'authorName'), authors,
            _.countBy(perDayEvs, 'advertiser'), adverts
        );
        return {
            videos,
            homepages,
            types,
            authors,
            adverts,
            type: _.omit(_.countBy(perDayEvs, 'type'), ['undefined']),
            authorName: _.omit(_.countBy(perDayEvs, 'authorName'), ['undefined']),
            advertiser: _.omit(_.countBy(perDayEvs, 'advertiser'), ['undefined']),
            dayStr,
        }
    });
    const oneWeekAgoDateString = moment().subtract(1, 'week').format("YYYY-MM-DD");
    return {
        json: { aggregated, oneWeekAgoDateString }
    };
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

    const allowFields = ['id', 'metadataId', 'savingTime'];
    const targetKey = req.params.key;
    const targetValue = req.params.value;

    // TODO savingTime is not really supported|tested
    if(allowFields.indexOf(targetKey) == -1)
        return { json: { "message": `Key ${targetKey} not allowed (${allowFields})`, error: true }};

    const matches = await automo.getVideosByPublicKey(k, _.set({}, targetKey, targetValue), false);
                                                            /* if 'true' would return also htmls */

    debug("getEvidences with flexible filter found %d matches", _.size(matches.metadata));
    return { json: matches.metadata };
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
