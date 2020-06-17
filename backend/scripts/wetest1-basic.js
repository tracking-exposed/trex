#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('wetest-1-basic —');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

const VERSION = 6; // every time a bug is fixed or a new feature get add, this increment for internal tracking 

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
    'checkup': produceInternalCheckup,
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
    return `${prefix}-ωτ1-v${VERSION}.${suffix}`;
}

/* ------------- START of accuracy debug section ------------------ */
const accuracyCounters = {};
function upsert(key, subkey, update) {
    let value = _.get(accuracyCounters, key + '.' + subkey, 0);
    _.set(accuracyCounters, key + '.' + subkey, value + update);
}
function updateStats(entry) {
    /* THIS function is call when the raw data is cleaned/updated for release */
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
    /* this dump the stats collected by accuracyCounter */
    _.each(accuracyCounters, function(value, entryName) {
        debug("%s%s%s", entryName, _.times(30 - _.size(entryName), " ").join(), _.map(value, function(amount, variableType) {
            let p = (amount / fullamount) * 100;
            return variableType + ": " + _.round(p, 1) + '%' ;
        }).join(" | "));
    });
}
/* ------------- END of accuracy debug section ------------------ */

function applyWetest1(e) {
    _.set(e, 'experiment', 'wetest1');
    _.set(e, 'pseudonyn', utils.string2Food(e.publicKey + "weTest#1") );
    _.unset(e, 'publicKey');
    updateStats(e);
    return e;
}
/* --- end of utilities --- */

/* -------------------------------------- the five functions --------------------------------------- */
async function produceHomeCSV(tf) {
    const home = await pickFromDB(_.extend(tf, {type: 'home'}), { clientTime: -1 });
    const unwind = _.reduce(home, csv.unwindSections, []);
    const ready = _.map(_.map(unwind, applyWetest1), function(e) {
        _.set(e, 'step', 'homepage');
        return e;
    });
    debug("Unwinded the 'selected sections' return %d evidences. Saving JSON file", _.size(ready));
    fs.writeFileSync(fileName('home', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('home', 'csv'), csvtext);
    accuracyDump(_.size(ready));
}

async function produceVideosCSV(tf) {
    const watches = await pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.map(testVideos, 'videoId')}
    }), { clientTime: -1 });
    const unroll = _.reduce(watches, csv.unrollRecommended, []);
    const ready = _.map(_.map(unroll, applyWetest1), function(e) {
        _.set(e, 'step', _.find(testVideos, { videoId: e.watchedVideoId }).language );
        return e;
    });
    debug("Unrolled the 'recommencted sections' return %d evidences. Saving JSON file", _.size(ready));
    fs.writeFileSync(fileName('videos', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('videos', 'csv'), csvtext);
    accuracyDump(_.size(ready));
    /*
    // this product to feed tests:longlabel --- this should become the sixth function
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
    debug("Considering %d htmls to pick unique metadataId(s)", _.size(watches));
    const evidences = _.groupBy(watches, 'metadataId');
    const elements = _.map(evidences, function(htmls, metadataId) {
        return metadataId; // _.last(_.sortBy(htmls, 'size')).id;
    });
    debug("filtered %d", _.size(elements));
    fs.writeFileSync(fileName('internal', 'json'), JSON.stringify(elements, undefined, 2), 'utf-8');
}

async function produceInternalCheckup(tf) {
    /* Produce a file containing the not-yet-processed metadataId, usable with --filter by parserver,
     * 100% means when every matching HTML has an existing metadata corrisponding in the metadata collection */
    const filter = _.extend(tf, { href: { "$in": _.map(testVideos, 'href')} });
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const l = await mongo3.aggregate(mongoc, nconf.get('schema').htmls, [{
             "$match": filter
        }, { "$project":
            { id: true, metadataId: true, size: true, href: true, savingTime: true, processed: true }
        }, { "$lookup":
            { from: 'metadata', localField: "metadataId", foreignField: 'id', as: 'm' }
        }, { "$project":
            { id: true, metadataId: true, processed: true, href: true,
                output: { $size: "$m" },
                selected: { $cond: { if: { $isArray: "$m.selected" }, then: { $size: "$m.selected" }, else: -1 } },
                related: { $cond: { if: { $isArray: "$m.related" }, then: { $size: "$m.related" }, else: -1 } }
            }
        }]);

        debug("<Internal stats>\ttotal %d, missing meta %d, with meta %d (circa the %d\%)",
            _.size( l ),
            _.size( _.filter(l, {output: 0}) ),
            _.size( _.reject(l, {output: 0}) ),
            _.round( ( _.size( _.reject(l, {output: 0}) ) / _.size(l) ), 2) * 100
        );
        debug("<Processed flag>\t%d true, %d false, %d missing", 
            _.size( _.filter(l, {processed: true}) ),
            _.size( _.filter(l, {processed: false}) ),
            _.size( _.filter(l, {processed: undefined }) )
        );
        const missingmetaids = _.uniq(_.map(_.filter(l, { 'output': 0}), 'metadataId'));
        debug("Saving metadataId not yet processed (%d) in missing*.json ", _.size(missingmetaids));
        fs.writeFileSync(fileName('missing', 'json'), JSON.stringify(missingmetaids, undefined, 2), 'utf-8');
        /* produce some non visually compelling output to decode visualization in console */
        const homes = _.map(_.groupBy(l, 'selected'), function(objs, selectedAmount) {
            return { selectedAmount, objects: _.size(objs) };
        });
        const videos = _.map(_.groupBy(l, 'related'), function(objs, relatedAmount) {
            return { relatedAmount, objects: _.size(objs) };
        });
        const outputs = _.map(_.groupBy(l, 'href'), function(objs, href) {
            return { href, objects: _.size(objs) };
        });
        debug("<home> %s\n<videos> %s\n<output> %s",
            JSON.stringify(homes, undefined, 2), JSON.stringify(videos, undefined, 2), JSON.stringify(outputs, undefined, 2)
        );
        await mongoc.close();
    } catch(e) {
        debug("Error in produceInternalCheckup: %s", e.message);
        throw e;
    } 
}

/* -------------------------------------- execution handler --------------------------------------- */
try {
    const what = nconf.get('type');
    if(!what || _.indexOf(_.keys(allowed), what) == -1 ) {
        console.log(`This script need --type ${_.keys(allowed).join('|')} and produces wetest1-related JSON/CSVs`);
        process.exit(1);
    }

    debug("[%s] is the target: starting wetest basic extractor…", what);
    allowed[what](timefilter);

} catch(e) {
    console.log("Error in the main function!", e.message);
}