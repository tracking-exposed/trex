const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('lib:glue');
const nconf = require('nconf');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
 
const mongo3 = require('./mongo3');

/* these async functions are used in: 
 *  bin/importfreshsample 
 * because it download a random timeline and import in the local db
 *
 * and `parsers/unique` (via lib/parse), because when a requested ID is not found,
 * is downloaded with the async function glue.retrive
 *
 * the api is /api/v1/glue/$password/$samplesize
 */

async function importer(content) {
    const htmlCleanFields = [ 'savingTime', 'id', 'userId', 
        'impressionId', 'timelineId', 'html' ];

    var timeline = content[2];
    timeline.startTime = new Date(content[2].startTime);
    var impressions = _.map(content[0], async function(i) {
        i.impressionTime = new Date(i.impressionTime);
        return i;
    });
    var htmls = _.map(content[1], async function(h) {
        var clean = _.pick(h, htmlCleanFields);
        clean.savingTime = new Date(clean.savingTime);
        return clean;
    });

    if(!_.size(htmls) || !_.size(impressions)) {
        debug("Found an empty timeline! (%s) nothing to save.",
            content[2].id);
        return [ null, [], [] ];
    }
    debug("Ready with a timeline with %d impressions and %d htmls",
        _.size(impressions), _.size(htmls));

    /* because one writing operation might fail for
     * duplicated Id the operation are separated */
    return [ timeline, impressions, htmls ];
}

function duplicatedError(error) { 
    if(error.code !== 11000) {
        debug("unexpected error?\n%s", error.message);
        console.log(error.stack);
        process.exit(0);
    }
}




async function retrive(htmlfilter) {
    const url = ( nconf.get('server') || 'https://testing.tracking.exposed' ) + '/api/v2/debug/html/' + htmlfilter.id;
    debug("Remotely retrive the HTML content (%s)", url);
    return request
        .getAsync(url)
        .then(async function(res) {
            return res.body;
        })
        .then(JSON.parse)
        .then(async function(x) {
            debug("Importing the HTML %s (%s | %s) impressionOrder %d",
                x.impression.htmlId,
                moment.duration(moment(x.impression.impressionTime) - moment()).humanize(),
                x.timeline.geoip,
                x.impression.impressionOrder
            );
            return [ x.timeline, [ x.impression ] , [ x.html ] ];
        });
};

async function writers(blob) {
    debug("Ready to write %d total bytes", _.size(JSON.stringify(blob)));

    const pls_test = 1;
    if(pls_test == 1) console.log("Please Claudio test different concurrency and review code");
    const mongoc = await mongo3.clientConnect({concurrency: pls_test});

    /* SEQUENCE: timelines - impression - html - supporter updates */
    if(blob[0] && _.get(blob[0], 'id')) {
        try {
            let x = await mongo3.writeOne(mongoc, nconf.get('schema').timelines, blob[0]);
            report(x, 'timelines');
        } catch(e) {
            duplicatedError(e);
        }
    }

    try {
        let x = await mongo3.writeMany(mongoc, nconf.get('schema').impressions, blob[1]);
        report(x, 'impressions');
    }
    catch(e) {
        duplicatedError(e);
    }

    const htmls = _.map(blob[2], function(html) {
        /* these hacks and updateSupporter, are necessary to make run the test with bin/parserv.js */
        _.unset(html, 'processed');
        html.savingTime = new Date();
        return html;
    });

    try {
        let x = await mongo3.writeMany(mongoc, nconf.get('schema').htmls, htmls);
        report(x, 'htmls');
    } catch(e) {
        duplicatedError(e);
    }

    if(blob[0]) {
        const userId = blob[0].userId;
        const readu = mongo3.readOne(mongoc, nconf.get('schema').supporters, { userId: userId });
        const updated = (readu && readu.userId == userId) ? readu: { userId };
        _.set(updated, 'lastActivity', new Date());
        await mongo.upsertOne(mongoc, nconf.get('schema').supporters, { userId: updated.userId }, updated);
    };

    await mongoc.close()
};

module.exports = {
    importer: importer,
    writers: writers,
    retrive: retrive
};
