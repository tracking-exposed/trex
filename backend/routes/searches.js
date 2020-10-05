const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:searches');
const nconf = require('nconf');
const qustr = require('querystring');

const CSV = require('../lib/CSV');
const params = require('../lib/params');
const dbutils = require('../lib/dbutils');
const security = require('../lib/security');
const utils = require('../lib/utils');


async function getSearches(req) {
    // '/api/v2/searches/:query/:paging?'
    const { amount, skip } = params.optionParsing(req.params.paging, 100);
    const qs = qustr.unescape(req.params.query);
    debug("getSearches %s query amount %d skip %d", qs, amount, skip);
    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerms: qs}, amount, true);
    const rv = _.map(entries, function(e) {
        e.pseudo = utils.string2Food(e.publicKey);
        return _.omit(e, ['_id', 'publicKey'])
    });
    debug("getSearches: returning %d matches about %s", _.size(rv), req.params.query);
    return { json: rv };
};

async function getQueries(req) {
    const campaignName = req.params.campaignName;
    debug("getQueries of %s", campaignName);
    const entries = await dbutils.getCampaignQuery(
        nconf.get('schema').campaigns,
        nconf.get('schema').queries,
        campaignName
    );
    debug("getQueries of %s returns %d elements", campaignName, _.size(entries));
    return { json: entries };
}

async function getSearchesCSV(req) {
    // '/api/v2/searches/:query/CSV'
    const MAXRVS = 3000;
    const { amount, skip } = params.optionParsing(req.params.paging, MAXRVS);
    const searchTerms = _.first(_.keys(qustr.parse(req.params.query)));
    debug("getSearchsCSV query string [%s] max amount %d", searchTerms, amount);

    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerms}, amount, true);
    const fixed = _.map(entries, function(e) {
        e.pseudo = utils.string2Food(e.publicKey);
        return _.omit(e, ['_id', 'publicKey']);
    });

    const overflow = (_.size(entries) == MAXRVS);
    const counters = _.countBy(entries, 'metadataId');
    debug("search query %s returned %d with max amount of %d (%j)",
        searchTerms, _.size(entries), MAXRVS, counters);

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
    const MAXRVS = 3000;
    const hardcodedAmount = 3;
    const hardcodedUnit = 'days';
    const { amount, skip } = params.optionParsing(req.params.paging, MAXRVS);
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
            amount: _.size(entries),
            overflow: (_.size(entries) == MAXRVS),
            skip,
            max: MAXRVS
        }
    }};
};

async function updateCampaigns(req) {
    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    const fixed = _.map(req.body, function(c) {
        c.endDate = new Date(c.endDate);
        c.startDate = new Date(c.startDate);
        c.lastUpdate = new Date();
        return c;
    });
    const result = await dbutils.writeCampaigns(nconf.get('schema').campaigns, fixed, 'name', 'lastUpdate');
    return { json: { error: !result } }
}

module.exports = {
    getSearches,
    getQueries,
    getSearchesCSV,
    getSearchKeywords,
    updateCampaigns,
};