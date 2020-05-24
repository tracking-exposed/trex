#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('wetest-1-basic —');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

/* static settings of weTEST#1 */
const testVideos = [{
    "href": "https://www.youtube.com/watch?v=Lo_m_rKReyg",
    "videoId": "Lo_m_rKReyg",
    "language": "Chinese"
  }, {
    "href": "https://www.youtube.com/watch?v=Zh_SVHJGVHw",
    "videoId": "Zh_SVHJGVHw",
    "language": "Spanish"
  }, {
    "href": "https://www.youtube.com/watch?v=A2kiXc5XEdU",
    "videoId": "A2kiXc5XEdU",
    "language": "English"
  }, {
    "href": "https://www.youtube.com/watch?v=WEMpIQ30srI",
    "videoId": "WEMpIQ30srI",
    "language": "Porutuguese"
  }, {
    "href": "https://www.youtube.com/watch?v=BNdW_6TgxH0",
    "videoId": "BNdW_6TgxH0",
    "language": "Arabic"
  }, {
    "href": "https://www.youtube.com/",
  },
];
const timefilter = {
    'savingTime': {
        "$gte": new Date('2020-03-25 00:00:00'),
        "$lte": new Date('2020-03-27 00:00:00')
        // without the 00:00:00 is:
        //  {"savingTime":{"$gte":"2020-03-24T23:00:00.000Z","$lte":"2020-03-26T23:00:00.000Z"},
        // with is:
        //  {"savingTime":{"$gte":"2020-03-25T00:00:00.000Z","$lte":"2020-03-27T00:00:00.000Z"},
    }
};
const allowed = {
    'home': produceHomeCSV,
    'video': produceVideosCSV,
    'internal': produceInternalData,
};

/* --- utilities --- */
async function pickFromDB(filter, sorting, special) {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        let rv = [];

        if(special) {
            rv = await mongo3.aggregate(mongoc, nconf.get('schema').htmls, [{ 
                "$match": filter
            },
            { "$project": { "id": 1, "metadataId": 1, "size": 1, 'href': 1, 'savingTime': 1 }}]);
        } else {
            rv = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, sorting);
        }
        debug("Completed DB access to fetch: %j: %d objects retrived", filter, _.size(rv));
        await mongoc.close();
        return rv;
    } catch(e) {
        debug("Error in pickFromDB: %s", e.message);
        return null;
    }
}

function fileName(prefix, suffix) {
    const ITERATION = 4;
    return `${prefix}-ωτ1-v${ITERATION}.${suffix}`;
}

const accuracyCounters = {};
function upsert(key, subkey, update) {
    let value = _.get(accuracyCounters, key + '.' + subkey, 0);
    _.set(accuracyCounters, key + '.' + subkey, value + update);
}
function updateStats(entry) {
    _.each(entry, function(value, key) {
        if(typeof value == typeof undefined)
            upsert(key, 'undefined', 1);
        else if(_.isNull(value))
            upsert(key, 'null', 1);
        else if(typeof value == typeof 1)
            upsert(key, 'int', 1);
        else if(typeof value == typeof "")
            upsert(key, 'string', 1);
        else if(_.isInteger(value.length))
            upsert(key, 'list', 1);
        else if(typeof value == typeof {})
            upsert(key, 'object', 1);
        else if(typeof value == typeof true && value)
            upsert(key, 'true', 1);
        else if(typeof value == typeof true && !value)
            upsert(key, 'false', 1);
        else
            debug("unknonw value type %s", typeof value);
    });
}
function accuracyDump(fullamount) {
    _.each(accuracyCounters, function(value, entryName) {
        debug("%s%s%s", entryName, _.times(30 - _.size(entryName), " ").join(), _.map(value, function(amount, variableType) {
            let p = (amount / fullamount) * 100;
            return variableType + ": " + _.round(p, 1) + '%' ;
        }).join(" | "));
    });
}

/* --- end of utilities --- */

/* two main function belows */
function unrollRecommended(memo, evidence) { // metadata.type = video with 'related' 
    _.each(evidence.related, function(related, evidenceCounter) {
        let entry = {
            pseudonyn: utils.string2Food(evidence.publicKey + "weTest#1"),
            evidence: evidenceCounter,
            login: evidence.login,
            id: evidenceCounter + '-' + evidence.id.replace(/[0-9]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,

            uxlang: evidence.blang,
            dataset: 'yttrex',
            experiment: 'wetest1',
            step: _.find(testVideos, { videoId: evidence.videoId }).language,

            parameter: related.parameter,
            recommendedVideoId: related.videoId,
            recommendedAuthor: related.recommendedSource,
            recommendedTitle: related.recommendedTitle, 
            recommendedLength: related.recommendedLength,
            recommendedDisplayL: related.recommendedDisplayL,
            recommendedLengthText: related.recommendedLengthText,
            recommendedPubTime: related.publicationTime,
            ptPrecision: related.timePrecision,
            recommendedRelativeS: related.recommendedRelativeSeconds, // distance between clientTime and publicationTime
            recommendedViews: related.recommendedViews,
            recommendedForYou: related.foryou,
            recommendedVerified: related.verified,
            recommendationOrder: related.index,
            recommendedKind: evidence.isLive ? "live": "video", // this should support also 'playlist' 

            watchedVideoId: evidence.videoId,
            watchedAuthor: evidence.authorName,
            watchedPubtime: evidence.publicationTime,
            watchedTitle: evidence.title,
            watchedViews: evidence.viewInfo.viewStr ? evidence.viewInfo.viewStr : null,
            watchedChannel: evidence.authorSource,
        };
        memo.push(entry);
        updateStats(entry);
    })
    return memo;
}

function unwindSections(memo, evidence) { // metadata.type = 'home' with 'selected'
    _.each(evidence.selected, function(selected, evidenceCounter) {
        let entry = {
            pseudonyn: utils.string2Food(evidence.publicKey + "weTest#1"),
            evidence: evidenceCounter,
            login: evidence.login,
            id: evidenceCounter + '-' + evidence.id.replace(/[0-9]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,
            order: selected.index,

            uxlang: evidence.uxlang,
            dataset: 'yttrex',
            experiment: 'wetest1',
            step: 'homepage',

            parameter: selected.parameter,
            sectionName: selected.sectionName,
            selectedVideoId: selected.videoId,
            selectedAuthor: selected.recommendedSource,
            selectedChannel: selected.recommendedHref,
            selectedTitle: selected.recommendedTitle,
            selectedLength: selected.recommendedLength,
            selectedDisplayL: selected.selectedDisplayL,
            selectedLengthText: selected.recommendedLengthText,
            selectedPubTime: selected.publicationTime,
            ptPrecision: selected.timePrecision,
            selectedRelativeS: selected.recommendedRelativeSeconds,
            selectedViews: selected.recommendedViews,
            selectedKind: selected.isLive ? "live": "video", // this should support also 'playlist' 
        };
        memo.push(entry);
        updateStats(entry);
    });
    return memo;
};

/* -------------------------------------- the two functions --------------------------------------- */
async function produceHomeCSV(tf) {
    const home = await pickFromDB(_.extend(tf, {type: 'home'}), { clientTime: -1 });
    const unwind = _.reduce(home, unwindSections, []);
    debug("Unnested the 'sections' return %d evidences. Saving JSON file", _.size(unwind));
    fs.writeFileSync(fileName('home', 'json'), JSON.stringify(unwind, undefined, 2));
    const csvtext = csv.produceCSVv1(unwind);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('home', 'csv'), csvtext);
    accuracyDump(_.size(unwind));
}

async function produceVideosCSV(tf) {
    const watches = await pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.map(testVideos, 'videoId')}
    }), { clientTime: -1 });
    const unroll = _.reduce(watches, unrollRecommended, []);
    debug("Unnested the 'sections' return %d evidences. Saving JSON file", _.size(unroll));
    fs.writeFileSync(fileName('videos', 'json'), JSON.stringify(unroll, undefined, 2));
    const csvtext = csv.produceCSVv1(unroll);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('videos', 'csv'), csvtext);
    accuracyDump(_.size(unroll));
    /*
    // this product to feed tests:longlabel
    const xxx = _.uniq(_.flatten(_.map(watches, function(e) {
        return _.map(e.related, function(r) {
            return { label: r.longlabel,
                     source: r.source 
            };
        });
    })));
    // const fina = _.times(50, function(t) { return _.sample(xxx); });
    fs.writeFileSync(fileName('special', 'jxxx'), "module.exports = " + JSON.stringify(xxx, undefined, 2), 'utf-8');
    */
}

async function produceInternalData(tf) {
    const watches = await pickFromDB(_.extend(tf, {
        href: { "$in": _.map(testVideos, 'href')}
    }), null, nconf.get('schema').htmls);
    debug("Read %d", _.size(watches));
    const evidences = _.groupBy(watches, 'metadataId');
    const elements = _.map(evidences, function(htmls, metadataId) {
        return _.last(_.sortBy(htmls, 'size')).id;
    });
    debug("filtered %d", _.size(elements));
    fs.writeFileSync(fileName('internal', 'json'), JSON.stringify(elements, undefined, 2), 'utf-8');
    /* done, no return value */
}

/* -------------------------------------- execution handler --------------------------------------- */
try {
    const what = nconf.get('type');
    if(!what || _.indexOf(_.keys(allowed), what) == -1 ) {
        console.log(`This script need --type ${_.keys(allowed).join('|')} and produces URL-centered CSVs`);
        process.exit(1);
    }

    debug("[%s] is the target: starting wetest basic extractor…", what);
    allowed[what](timefilter);

} catch(e) {
    console.log("Error in the main function!", e.message);
}