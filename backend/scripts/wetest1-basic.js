#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('wetest-1-basic');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');

nconf.argv().env().file({ file: 'config/settings.json' });

/* static settings of weTEST#1 */
const videoURLS = [
        'https://www.youtube.com/watch?v=Lo_m_rKReyg',
        'https://www.youtube.com/watch?v=Zh_SVHJGVHw',
        'https://www.youtube.com/watch?v=A2kiXc5XEdU',
        'https://www.youtube.com/watch?v=WEMpIQ30srI',
        'https://www.youtube.com/watch?v=BNdW_6TgxH0',
];
const timefilter = {
    'savingTime': {
        "$gte": new Date('2020-03-25 00:00:00'),
        "$lte": new Date('2020-03-27 00:00:00')
    }
};
const allowed = {
    'home': produceHomeCSV,
    'videos': produceVideosCSV,
};

/* --- utilities --- */
async function pickFromDB(filter, sorting) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const rv = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, sorting);
    await mongoc.close();
    debug("Completed DB access to fetch: %j: %d objects retrived", filter, _.size(rv));
    return rv;
}

function unwindSections(memo, e) {
    _.each(e.selected, function(v) {
        let evidence = _.pick(e, ['savingTime', 'clientTime', 'login'] );
        evidence.pseudonyn = (_.parseInt(e.publicKey.replace(/[a-zA-Z]/g, '')) % 9999)
        _.extend(evidence,
            _.pick(v, ['viz', 'duration', 'timeago', 'textTitle', 'order', 'authorName', 'href', 'authorHref']))
        memo.push(evidence)
    });
    return memo;
};

/* -------------------------------------- the two functions --------------------------------------- */
async function produceHomeCSV(tf) {
    const home = await pickFromDB(_.extend(tf, {type: 'home'}), { clientTime: -1 });

    const unwind = _.reduce(home, unwindSections, []);
    debug("Unnested the 'sections' return %d evidences. Saving JSON file", _.size(unwind));
    fs.writeFileSync('home-day1' + '.json', JSON.stringify(unwind, undefined, 2));
    const csvtext = csv.produceCSVv1(unwind);
    debug("Produced %d bytes for text/csv, saving file", _.size(csvtext));
    fs.writeFileSync('home-day1' + '.csv', csvtext);
}

async function produceVideosCSV(tf) {
}

/* -------------------------------------- execution handler --------------------------------------- */
try {
    const what = nconf.get('type');
    if(!what || _.indexOf(_.keys(allowed), what) == -1 ) {
        console.log("This script need --type"+ _.keys(allowed).join('|') +"and produces URL-centered CSVs");
        process.exit(1);
    }
    debug("[%s] is the target: starting wetest basic extractor…", what);
    allowed[what](timefilter);
} catch(e) {
    console.log("Error in the main function!", e.message);
}