#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('wetest-1-basic —');
const nconf = require('nconf');
const fs = require('fs');
const path = require('path');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const wetest = require('../lib/wetest');
const mongo3 = require('../lib/mongo3');
const moment = require('moment');

const VERSION = 7; // every time a bug is fixed or a new feature get add, this increment for internal tracking 

nconf.argv().env().file({ file: 'config/settings.json' });

/* static settings of weTEST#1 */
const testVideos = [{
    "href": "https://www.youtube.com/watch?v=Lo_m_rKReyg",
    "videoId": "Lo_m_rKReyg",
    "language": "Chinese",
    "apifile": "video1.json"
  }, {
    "href": "https://www.youtube.com/watch?v=Zh_SVHJGVHw",
    "videoId": "Zh_SVHJGVHw",
    "language": "Spanish",
    "apifile": "video2.json"
  }, {
    "href": "https://www.youtube.com/watch?v=A2kiXc5XEdU",
    "videoId": "A2kiXc5XEdU",
    "language": "English",
    "apifile": "video3.json"
  }, {
    "href": "https://www.youtube.com/watch?v=WEMpIQ30srI",
    "videoId": "WEMpIQ30srI",
    "language": "Porutuguese",
    "apifile": "video4.json"
  }, {
    "href": "https://www.youtube.com/watch?v=BNdW_6TgxH0",
    "videoId": "BNdW_6TgxH0",
    "language": "Arabic",
    "apifile": "video5.json"
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
    'session': produceSessionData,
    'factcheck': produceFactCheckCSV,
    'qualitative': produceQualitative,
};

function fileName(prefix, suffix) {
    return `${prefix}-ωτ1-v${VERSION}.${suffix}`;
}

function loadYTAPI(fname) {
    const fullpath = path.join(__dirname, '..', '..', '..', 'experiments-data', 'wetest1', 'ytAPI', fname);
    const jstr = fs.readFileSync(fullpath, {encoding:'utf-8'} );
    const data = JSON.parse(jstr);
    return _.map(data.items, function(e) {
        return e.id ? e.id.videoId : null;
    });
}


/* -------------------------------------- the five functions --------------------------------------- */
async function produceHomeCSV(tf) {
    const home = await wetest.pickFromDB(_.extend(tf, {type: 'home'}), { clientTime: -1 });
    const unwind = _.reduce(home, csv.unwindSections, []);
    const ready = _.map(_.map(unwind, wetest.applyWetest1), function(e) {
        _.set(e, 'step', 'homepage');
        return e;
    });
    debug("Unwinded the 'selected sections' return %d evidences. Saving JSON file", _.size(ready));
    fs.writeFileSync(fileName('home', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('home', 'csv'), csvtext);
    wetest.accuracyDump(_.size(ready));
}

async function produceVideosCSV(tf) {
    const watches = await wetest.pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.compact(_.map(testVideos, 'videoId')) }
    }), { clientTime: -1 });
    const unroll = _.reduce(watches, csv.unrollRecommended, []);
    const apivideos = _.uniq(_.flatten(_.map(_.compact(_.map(testVideos, 'apifile')), loadYTAPI)));
    debug("In total we've %d videos 'related' from API", _.size(apivideos) );
    const ready = _.map(_.map(unroll, wetest.applyWetest1), function(e) {
        let isAPItoo = apivideos.indexOf(e.recommendedVideoId) !== -1;
        _.set(e, 'top20', (e.recommendationOrder <= 20) );
        _.set(e, 'isAPItoo', isAPItoo);
        _.set(e, 'step', _.find(testVideos, { videoId: e.watchedVideoId }).language );
        _.set(e, 'thumbnail', "https://i.ytimg.com/vi/" + e.recommendedVideoId + "/mqdefault.jpg");
        return e;
    });
    debug("Unrolled the 'recommencted sections' return %d evidences. Saving JSON file", _.size(ready));
    fs.writeFileSync(fileName('videos', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('videos', 'csv'), csvtext);
    wetest.accuracyDump(_.size(ready));
}

async function produceQualitative(tf) {
    const HFname = 'Imported-Evaluated-Quality.csv'
    debug("Produce Qualitative Experiment with hardcoded filename %s", HFname);
    const acquired = fs.readFileSync(HFname, 'utf-8');
    /* what's going to happen here is unstable, still it is a successful experiment :shrug_emoji: */
    const lines = _.tail(acquired.split('\n'));
    /* _.tail strange thing about cutting only the first line */
    const qualitative = _.map(lines, function(line, ln) {
        let videoId = line.split(',')[0].substr(28);
        let attribution = null;
        debugger;
        if( _.endsWith(line.trim(), ',,,x') )
            attribution = 'off-topic';
        else if ( _.endsWith(line.trim(), ',,x,') )
            attribution = 'linked';
        else if ( _.endsWith(line.trim(), ',x,,') )
            attribution = 'relevant';
        else
            debug("Missing in line %d %s", ln, line.trim());
        return {
            videoId,
            attribution
        }
    });
    const watches = await wetest.pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.compact(_.map(testVideos, 'videoId')) }
    }), { clientTime: -1 });
    const unroll = _.reduce(watches, csv.unrollRecommended, []);
    const apivideos = _.uniq(_.flatten(_.map(_.compact(_.map(testVideos, 'apifile')), loadYTAPI)));
    debug("In total we've %d videos 'related' from API", _.size(apivideos) );
    const ready = _.compact(_.map(_.map(unroll, wetest.applyWetest1), function(e) {
        const stepName = _.find(testVideos, { videoId: e.watchedVideoId }).language;
        if(stepName !== 'English')
            return null;
        _.set(e, 'step', 'English');
        let isAPItoo = apivideos.indexOf(e.recommendedVideoId) !== -1;
        _.set(e, 'top20', (e.recommendationOrder <= 20) );
        _.set(e, 'isAPItoo', isAPItoo);
        _.set(e, 'thumbnail', "https://i.ytimg.com/vi/" + e.recommendedVideoId + "/mqdefault.jpg");
        let judgment = _.find( qualitative, { videoId: e.recommendedVideoId });
        _.set(e, 'qualitative', judgment.attribution);
        return e;
    }));
    debug("Filtered only English step and added qualitative imported values: return %d evidences. Saving JSON file", _.size(ready));
    fs.writeFileSync(fileName('qualitative', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('qualitative', 'csv'), csvtext);
    wetest.accuracyDump(_.size(ready));
}

async function produceFactCheckCSV(tf) {
    debug("Experimental fact check production would generated five CSV");
    const watches = await wetest.pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.compact(_.map(testVideos, 'videoId')) }
    }), { clientTime: -1 });
    const unroll = _.reduce(watches, csv.unrollRecommended, []);
    const apivideos = _.uniq(_.flatten(_.map(_.compact(_.map(testVideos, 'apifile')), loadYTAPI)));
    debug("In total we've %d videos 'related' from API", _.size(apivideos) );
    const minimized = _.map(_.map(unroll, wetest.applyWetest1), function(e) {
        let isAPItoo = apivideos.indexOf(e.recommendedVideoId) !== -1;
        _.set(e, 'top20', (e.recommendationOrder <= 20) );
        _.set(e, 'isAPItoo', isAPItoo);
        _.set(e, 'step', _.find(testVideos, { videoId: e.watchedVideoId }).language );
        _.set(e, 'thumbnail', "https://i.ytimg.com/vi/" + e.recommendedVideoId + "/mqdefault.jpg");
        _.set(e, 'recommendedVideoURL', "https://youtube.com/watch?v=" + e.recommendedVideoId);
        return _.pick(e, ['recommendedVideoURL', 'top20', 'recommendedAuthor', 'recommendedTitle', 'thumbnail', 'step']);
    });

    _.each(_.compact(_.map(testVideos, 'language')), function(step) {
        const bystep = _.filter(minimized, { step } );
        const grouped = _.groupBy(bystep, 'recommendedVideoURL');
        const finalized = _.map(grouped, function(listof, URL) {
            const retval = _.first(listof);
            retval.amount = _.size(listof);
            return retval;
        })
        const csvtext = csv.produceCSVv1(finalized);
        debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
        fs.writeFileSync(fileName('factcheck-' + step, 'csv'), csvtext);
    })
}

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

async function produceSessionData(tf) {
    const watches = await wetest.pickFromDB(_.extend(tf, {
        type: 'video',
        videoId: { "$in": _.compact(_.map(testVideos, 'videoId')) }
    }), { clientTime: -1 });

    const persons = _.uniq(_.map(watches, 'publicKey'));
    debug("%d evidences; found %d ppl", _.size(watches), _.size(persons));

    const sessionFiltered = _.map(persons, function(p) {
        const videobel = _.reverse(_.filter(watches, {publicKey: p}));

        const ordered = videobel;
        if(_.size(videobel) < 5) {
            debug("Ignoring contribution of %s, because only %d videos avail", p, _.size(ordered));
            return null;
        }
        let retval = [];
        let sessionId = utils.hash({sessionOf: p});
        _.each(ordered, function(v) {
            let position = _.size(retval);
            if(testVideos[position].videoId === v.params.v) {
                _.set(v, 'sessionId', sessionId);
                retval.push(v);
            }
        })
        if(_.size(retval) === 5)
            return retval;
        debug("Killing contribution of %s, seen sequence of %d on available %d entries", p, _.size(retval), _.size(ordered) )
        return null;
    });

    debug("keeping only sessions, compact x = %d", _.size(_.compact(sessionFiltered)));
    const sessionOnly = _.flatten(_.compact(sessionFiltered));

    const unroll = _.reduce(sessionOnly, csv.unrollRecommended, []);
    const apivideos = _.uniq(_.flatten(_.map(_.compact(_.map(testVideos, 'apifile')), loadYTAPI)));
    debug("In total we've %d videos 'related' from API", _.size(apivideos) );
    const ready = _.map(_.map(unroll, wetest.applyWetest1), function(e) {
        let isAPItoo = (apivideos.indexOf(e.recommendedVideoId) !== -1);
        _.set(e, 'top20', (e.recommendationOrder <= 20) );
        _.set(e, 'isAPItoo', isAPItoo);
        _.set(e, 'step', _.find(testVideos, { videoId: e.watchedVideoId }).language );
        _.set(e, 'thumbnail', "https://i.ytimg.com/vi/" + e.recommendedVideoId + "/mqdefault.jpg");
        return e;
    });
    debug("Unrolled the 'recommencted sections' of complete session only. return %d evidences.", _.size(ready));
    fs.writeFileSync(fileName('sessions', 'json'), JSON.stringify(ready, undefined, 2));
    const csvtext = csv.produceCSVv1(ready);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync(fileName('sessions', 'csv'), csvtext);
    accuracyDump(_.size(ready));
}

async function produceInternalData(tf) {
    const watches = await wetest.pickFromDB(_.extend(tf, {
        href: { "$in": _.compact(_.map(testVideos, 'href')) }
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
    wetest.startTime('2020-03-25 00:00:00');
    debug("[%s] is the target: starting wetest basic extractor…", what);
    allowed[what](timefilter);
} catch(e) {
    console.log("Error in the main function!", e.message);
}