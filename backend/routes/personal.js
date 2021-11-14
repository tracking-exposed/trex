const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

async function getPersonal(req) {
    const DEFMAX = 100;
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
        debug("Returning %d videos of %d from a profile hereSince %s, search %d",
            _.size(data.recent), data.total, data.supporter.hereSince, _.size(data.searches));
    } catch(error) {
        console.log(error);
        debug("Catch exception in getSummaryByPublicKey: %s", error.message);
        return { json: { "message": error.message, "error": true }};
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
    const k =  req.params.publicKey;
    const type = req.params.type;

    if(['home', 'video', 'search'].indexOf(type) === -1 ) 
        return { text: "Error 🤷 Invalid request, only 'video' or 'home' are supported" };

    const data = await automo.getMetadataByPublicKey(k, { amount: CSV_MAX_SIZE, skip: 0, typefilter: type });
    /* this return of videos or homepage, they generated slightly different CSV formats */

    debug("returned %d data in getPersonalCSV", _.size(data));
    const sourceCounter = _.size(data.metadata);
    const ready = CSV.unrollNested(data.metadata, {
        type, private: true
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
    const DEFMAX = 300;
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
    debug("getPersonalTimelines request by %s using %d starting videos, skip %d (defmax %d)", k, amount, skip, DEFMAX);
    const c = await automo.getMetadataByPublicKey(k, {
        takefull: true,
        amount, skip,
        timefilter: moment().subtract(2, 'months').format("YYYY-MM-DD")
    });

    const list = _.map(c.metadata, function(e) {
        /* console.log( e.value, _.keys(_.pick(e, ['ad', 'title', 'authorName'])),
            _.pick(e, ['ad', 'title', 'authorName']) ); */
        e.value = utils.hash(e, _.keys(_.pick(e, ['ad', 'title', 'authorName'])));
        e.dayString = moment(e.savingTime).format("YYYY-MM-DD");
        e.numb = _.parseInt(_.replace(e.value, '/(c+)/', ''));
        return e;
    });
    debug("getPersonalTimelines transforming %d last %s ", _.size(list), 
        ( _.first(list) ? _.first(list).title : "[nothing]" )  );

    const grouped = _.groupBy(list, 'dayString');
    const aggregated = _.map(grouped, function(perDayEvs, dayStr) {

        const videos = _.filter(perDayEvs, { 'type': 'video' }); 
        const homepages = _.filter(perDayEvs, { 'type': 'home' });

        const totalsuggested = _.sum(_.map(homepages, function(h) { return _.size(h.selected); }))
        const typeUndef = _.sum(_.map(_.countBy(perDayEvs, 'type'), function(amount, name) { return amount; }));
        const types = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'type'), ['undefined']), function(amount, name) { return amount; }));
        const authors = _.sum(_.map(_.countBy(videos, 'authorName'), function(amount, name) { return amount; }));
        // let adverts = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'advertiser'), ['undefined']), function(amount, name) { return amount; }));
        /* debug("%s <Vid %d Home %d> -> %j %d - %j %d", dayStr,
            _.size(videos), _.size(homepages),
            _.countBy(perDayEvs, 'type'), types,
            _.countBy(videos, 'authorName'), authors,
        ); */
        return {
            titles: _.map(videos, 'title'),
            homepages,
            types,
            typeUndef,
            totalsuggested,
            authors,
            type: _.countBy(perDayEvs, 'type'),
            authorName: _.countBy(videos, 'authorName'),
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
    const related = await automo.getRelatedByWatcher(k, { amount, skip });
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
    if(allowFields.indexOf(targetKey) === -1)
        return { json: { "message": `Key ${targetKey} not allowed (${allowFields})`, error: true }};

    const matches = await automo
        .getVideosByPublicKey(k, _.set({}, targetKey, targetValue), false);
                        /* if last param is 'true' would return html too */

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
