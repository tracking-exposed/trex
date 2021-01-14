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

const MAXRVS = 5000;

async function getSearches(req) {
    // '/api/v2/searches/:query/:paging?' 
    // this is used in v.md
    const { amount, skip } = params.optionParsing(req.params.paging, 100);
    const qs = qustr.unescape(req.params.query);
    debug("getSearches %s query amount %d skip %d", qs, amount, skip);
    const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerms: qs}, amount, true);
    const rv = _.map(entries, function(e) {
        e.pseudo = utils.string2Food(e.publicKey);
        if(e.relativeSeconds)
            e.ttl = moment.duration(e.relativeSeconds * 1000).humanize();
        return _.omit(e, ['_id', 'publicKey', 'selectedChannel', 'relativeSeconds']);
    });
    debug("getSearches: returning %d matches about %s", _.size(rv), req.params.query);
    return { json: rv };
};

async function getQueries(req) {
    // this is the API used in campaigns like: http://localhost:1313/chiaro/excample/
    const campaignName = req.params.campaignName;
    debug("getQueries of %s", campaignName);
    const entries = await dbutils.getCampaignQuery(
        nconf.get('schema').campaigns,
        nconf.get('schema').queries,
        campaignName
    );

    if(!entries)
        return { json: {
                error: true,
                message: "Campaign not found in our DB",
                request: campaignName,
            }
        }

    debug("getQueries of %s returns %d elements", campaignName, _.size(entries));
    return { json: entries };
}

async function getSearchesCSV(req) {
    // '/api/v2/searches/:query/CSV'
    // this is used by v.md and to download from the CHIARO's page
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
        'overflow' + searchTerms + '-' + _.size(entries) + "-" + moment().format("YY-MM-DD") + ".csv" : 
        searchTerms + '-' + _.size(entries) + "-" + moment().format("YY-MM-DD") + ".csv" ;

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
    // this returns an unchecked list of USG therefore should be discontinued
    throw new Error("Discontinued");
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
    debug("Fixed %d campaigns to update", _.size(fixed))
    const result = await dbutils.writeCampaigns(nconf.get('schema').campaigns, fixed, 'name');
    return { json: result }
}

async function getSearchDetails(req) {
    /* this API is used to ask for individual metadataId, and by a visualization that want to 
     * visualize small snippet in a look-and-feel close to the one of youtube */
    const ids = req.params.listof.split(',');
    debug("getSearchDetails got a request for %d searches.metadataId", ids.length);
    const { structured, info } = await dbutils.compareSearches(nconf.get('schema').searches, ids);
    debug("Returning %d search results with: %j videos (forced limit of 200 per metadataId)",
        _.size(_.keys(structured)), _.values(structured).map(_.size), 
    );
    return { json: {
        structured,
        info,
    }};
}


module.exports = {
    getSearches,
    getQueries,
    getSearchesCSV,
    getSearchKeywords,
    getSearchDetails,
    updateCampaigns,
};
