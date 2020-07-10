const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:statistics');
const nconf = require('nconf');

const mongo3 = require('../lib/mongo3');

/* -- this cache is shared with yttrex, might be generalized or figured out
 * if something native from mongo exists ? */

/*
 -- suspended
function formatCached(what, updated)
function cacheAvailable(what)
function countStoredDocuments()

function counter(req)
function parsers(req)
 */

async function statistics(req) {
    // the content in 'stats' is saved by count-o-clock and the selector here required is
    // specifiy in config/stats.json
    const expectedFormat = "/api/v2/statistics/:name/:unit/:amount";

    const allowedNames = ['supporters', 'active', 'related', 'processing', 'metadata', 'usage', 'searches', 'labels'];
    const name = req.params.name;
    if(allowedNames.indexOf(name) == -1) {
        debug("Error! this might not appear in visualization: investigate on why an invalid stat-name is called by c3! (%s)", name);
        return { json: { error: true, expectedFormat, allowedNames, note: `the statistic name you look for was ${name}` }}
    }

    const unit = req.params.unit;
    const allowedRanges = ['hours', 'hour', 'day', 'days'];
    if(allowedRanges.indexOf(unit) == -1 ) {
        debug("Error! this might not appear in visualization, but the API call has a malformed time-unit!");
        return { json: { error: true, expectedFormat, allowedRanges, note: `the statistic unit you look for was ${unit}` }}
    }

    const amount = _.parseInt(req.params.amount);
    if(_.isNaN(amount)) {
        debug("Error! this might not appear in visualization, but the API call has an invalid number!");
        return { json: { error: true, expectedFormat, invalidNumber: req.params.amount }};
    }

    const filter = { name };
    const refDate = new Date( moment().subtract(amount, _.nth(unit, 0)));

    if(_.startsWith(unit, 'day'))
        _.set(filter, 'day', { '$gt': refDate });
    else
        _.set(filter, 'hour', { '$gt': refDate });

        
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const fullc = await mongo3.read(mongoc, nconf.get('schema').stats, filter);
    const content = _.map(fullc, function(e) {
        return _.omit(e, ['_id']);
    });
    debug("Requested [%s] since %d %s ago = %d samples", name, amount, unit, _.size(content));
    mongoc.close();
    return { json: content,
        headers: { amount, unit, name }
    };
}

module.exports = {
    statistics
};
