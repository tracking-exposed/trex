const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:searches');
const nconf = require('nconf');
const qustr = require('querystring');

const CSV = require('../lib/CSV');
const params = require('../lib/params');
const dbutils = require('../lib/dbutils');


async function getSearches(req) {
    // '/api/v2/searches/:query/:paging?'
    const { amount, skip } = params.optionParsing(req.params.paging, 100);
    const qs = req.params.query;
    debug("getSearchs %s query amount %d skip %d", qs, amount, skip);
    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerm: qs}, amount, true);
    const rv = _.map(entries, function(e) {
        e.pseudo = e.publicKey.replace(/[0-9a-n]/g, '');
        return _.omit(e, ['_id', 'publicKey'])
    });
    debug("getRelated: returning %d matches about %s", _.size(rv), req.params.query);
    return { json: rv };
};

async function getSearchesCSV(req) {
    // '/api/v2/searches/:query/CSV'
    const MAXRVS = 3000;
    const { amount, skip } = params.optionParsing(req.params.paging, MAXRVS);
    const qs = qustr.unescape(req.params.query);
    debug("getSearchsCSV [%s] query string, max amount %d", qs, amount);

    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerms: qs}, amount, true);
    const fixed = _.map(entries, function(e) {
        e.pseudo = e.publicKey.replace(/[0-9a-n]/g, '').substr(0, 7);
        return _.omit(e, ['_id', 'publicKey']);
    });

    const overflow = (_.size(entries) == MAXRVS);
    const counters = _.countBy(entries, 'metadataId');
    debug("search query %s returned %d with max amount of %d (%j)", qs, _.size(entries), MAXRVS, counters);
    const csv = CSV.produceCSVv1(fixed);

    if(!_.size(csv))
        return { text: "Error 🤷 No content produced in this CSV!" };

    const filename = overflow ? 
        'overflow' + qs + '-' + _.size(entries) + "-" + moment().format("YY-MM-DD") + ".csv" : 
        qs + '-' + _.size(entries) + "-" + moment().format("YY-MM-DD") + ".csv" ;

    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
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
    getSearchesCSV,
    getSearchKeywords,
};