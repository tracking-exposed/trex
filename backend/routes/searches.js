const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:searches');
const nconf = require('nconf');

const params = require('../lib/params');
const dbutils = require('../lib/dbutils');


async function getSearches(req) {
    // '/api/v2/searches/:query/:paging?'
    const { amount, skip } = params.optionParsing(req.params.paging, 100);
    const qs = req.params.query;
    debug("getSearchs %s query amount %d skip %d", qs, amount, skip);
    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {}, amount, true);
    const rv = _.map(entries, function(e) {
        e.pseudo = e.publicKey.replace(/[0-9a-n]/g, '');
        return _.omit(e, ['_id', 'publicKey'])
    });
    debug("getRelated: returning %d matches about %s", _.size(rv), req.params.query);
    return { json: rv };
};

async function getSearchKeywords(req) {
    // '/api/v2/search/keywords/:paging?'
    const hardcodedAmount = 17;
    const hardcodedUnit = 'days';
    const { amount, skip } = params.optionParsing(req.params.paging, 200);
    const entries = await dbutils.reduceRecentSearches(
        nconf.get('schema').searches,
        amount, {
            "savingTime": {
                "$gt": new Date(moment().subtract(hardcodedAmount, hardcodedUnit).toISOString()) }
        }
    );
    debug("getSearchKeywords with paging amount %d (skip %d IGNORED) returns %d with hardcoded-recent-filter %j",
        amount, skip, _.size(entries), { hardcodedAmount, hardcodedUnit });
    return { json: {
        "selist": entries,
        "parameters": {
            hardcodedAmount,
            hardcodedUnit,
            amount,
            skip
        }
    }};
};

module.exports = {
    getSearches,
    getSearchKeywords,
};
