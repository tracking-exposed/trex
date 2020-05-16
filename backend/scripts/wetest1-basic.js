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

const ITERATION = 3;
function fileName(prefix, suffix) {
    return `${prefix}-ωτ1-v${ITERATION}.${suffix}`;
}

function unrollRecommended(memo, evidence) {
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
            type: 'video',
            step: _.find(testVideos, { videoId: evidence.videoId }).language,

            recommendedVideoId: related.videoId,
            recommendedViews: (related.mined) ? related.mined.viz : null,
            recommendedDuration: (related.mined) ? related.mined.duration : null,
            recommendedPubtime: (related.mined) ? related.mined.timeago : null,
            recommendedForYou: related.foryou,
            recommendedTitle: related.title,
            recommendedAuthor: related.source,
            recommendedVerified: related.verified,
            recommendationOrder: related.index,

            watchedVideoId: evidence.videoId,
            watchedAuthor: evidence.authorName,
            watchedPubtime: evidence.publicationTime,
            watchedTitle: evidence.title,
            watchedViews: evidence.viewInfo.viewStr ? evidence.viewInfo.viewStr : null,
            watchedChannel: evidence.authorSource,
        };
        memo.push(entry);
    })
    return memo;
}

function unwindSections(memo, evidence) {
    _.each(evidence.selected, function(selected, evidenceCounter) {
        let entry = {
            pseudonyn: utils.string2Food(evidence.publicKey + "weTest#1"),
            evidence: evidenceCounter,
            login: evidence.login,
            id: evidenceCounter + '-' + evidence.id.replace(/[0-9]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,

            uxlang: evidence.uxlang,
            dataset: 'yttrex',
            experiment: 'wetest1',
            step: 'homepage',

            /* TODO section Name  + isLive */
            selectedVideoId: selected.href.replace(/\/watch\?v=/, ''),
            selectedViews: selected.viz,
            selectedDuration: selected.duration,
            selectedPubtime: selected.mined.timeago + " not precise ",
            selectedTitle: selected.title,
            selectedAuthor: selected.authorName,
            selectedChannel: selected.authorHref,
            recommendationOrder: selected.index
        };
        memo.push(entry);
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
}

async function produceVideosCSV(tf) {
    const watches = await pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.map(testVideos, 'videoId')}
    }), { clientTime: -1 });
    /*
    const unroll = _.reduce(watches, unrollRecommended, []);
    debug("Unnested the 'sections' return %d evidences. Saving JSON file", _.size(unroll));
    fs.writeFileSync(fileName('videos', 'json'), JSON.stringify(unroll, undefined, 2));
    const csvtext = csv.produceCSVv1(unroll);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('videos', 'csv'), csvtext);
    */
    // this product to feed tests:longlabel
    const xxx = _.uniq(_.flatten(_.map(watches, function(e) {
        return _.map(e.related, function(r) {
            return { label: r.longlabel,
                     source: r.source 
            };
        });
    })));
    /* const fina = _.times(50, function(t) { return _.sample(xxx); }); */
    fs.writeFileSync(fileName('special', 'jxxx'), "module.exports = " + JSON.stringify(xxx, undefined, 2), 'utf-8');
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