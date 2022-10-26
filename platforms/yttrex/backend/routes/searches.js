import automo from '../lib/automo';
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:searches');
const qustr = require('querystring');

const CSV = require('../lib/CSV');
const params = require('../lib/params');

/* this file have been heavily refactored
 * because between 1.4.x and 1.8.x the search
 * result collection method changed; now uses
 * metadata; as part of the refactor, we defined
 * the pages needed to be supported:
 *
 * - personal page:
 *      list of search queries made by PubKey
 * - personal page/popup:
 *      download search queries in CSV (per PubKey)
 * - experiments:
 *      every content marked with an experimentId might return.
 * - comparison:
 *      run a comparison among the same search results
 */

const MAXRVS = 90;

async function getSearches(req) {
    // '/api/v2/searches/:query/:paging?' 
    // this is used in v.md
    throw new Error("Not yet updated!");
    // this is not updates as have been the CSV -- TODO FIX REFACTOR 
    // const AMOUNT = 400; // THIS differs from MAXRVS because want to load differently CSV than page;
    // const { amount, skip } = params.optionParsing(req.params.paging, AMOUNT);
    // const qs = qustr.unescape(req.params.query);
    // debug("getSearches %s query amount %d skip %d", qs, amount, skip);
    // const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {searchTerms: qs}, amount, true);
    // const rv = _.map(entries, function(e) {
    //     e.pseudo = utils.string2Food(e.publicKey);
    //     if(e.relativeSeconds)
    //         e.ttl = moment.duration(e.relativeSeconds * 1000).humanize();
    //     return _.omit(e, ['_id', 'publicKey', 'selectedChannel', 'relativeSeconds']);
    // });
    // debug("getSearches: returning %d matches about %s", _.size(rv), req.params.query);
    // return { json: {
    //     data: rv,
    //     maxAmount: AMOUNT,
    //     overflow: (_.size(rv) === AMOUNT) }
    // };
};

async function getQueries(req) {
    // TO BE REVIEW THIS,  or just to be removed becaue the by Campaign is useless.
    // this is the API used in campaigns like: http://localhost:1313/chiaro/example/
    throw new Error("Not yet updated!");
    // const campaignName = req.params.campaignName;
    // debug("getQueries of %s", campaignName);
    // const entries = await dbutils.getCampaignQuery(
    //     nconf.get('schema').campaigns,
    //     nconf.get('schema').queries,
    //     campaignName
    // );

    // if(!entries)
    //     return { json: {
    //             error: true,
    //             message: "Campaign not found in our DB",
    //             request: campaignName,
    //         }
    //     }

    // debug("getQueries success: %s returns %d elements", campaignName, _.size(entries));
    // return { json: entries };
}

async function getSearchesCSV(req) {
    // '/api/v2/searches/:query/CSV'
    // this is used by v.md and to download from the CHIARO's page
    const { amount, skip } = params.optionParsing(req.params.paging, MAXRVS);
    const searchTerms = _.first(_.keys(qustr.parse(req.params.query)));

    debug("getSearchsCSV query string [%s] max amount %d (skip %d)", searchTerms, amount, skip);
    if(skip)
        debug("Warning: skip %d isnt' considered", skip);

    const entries = await automo.getMetadataByFilter({query: searchTerms}, {amount, skip});
    const overflow = (_.size(entries) === MAXRVS);
    const depacked = CSV.unrollNested(entries, { type: 'search', private: true });
    debug("Once depacked the %s entries become %d", entries.length, depacked.length);
    const csv = CSV.produceCSVv1(depacked);
    if(!_.size(csv))
        return { text: "Error 🤷 No content produced in this CSV!" };

    const filename = overflow ? 
        'overflow-' + searchTerms + '-#' + _.size(entries) + "-" + moment().format("YYYY-MM-DD") + ".csv" : 
        searchTerms + '-#' + _.size(entries) + "-" + moment().format("YYYY-MM-DD") + ".csv" ;

    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csv,
    };
};

async function getSearchesDot(req) {

    throw new Error("Not yet updated!");
    // const qs = req.params.idList;
    // const idList = qs.split(',');
    // debug("getSearchesDot take as source id list: %j", idList);
    // const entries = await dbutils.getLimitedCollection(nconf.get('schema').searches, {
    //     metadataId: { "$in": idList }
    // }, MAXRVS, true);

    // if(_.size(entries) === MAXRVS)
    //     debug("paging not managed in getSearchesDot, please review!!");

    // const data = _.map(entries, function(e) {
    //     e.pseudo = utils.string2Food(e.publicKey);
    //     if(e.relativeSeconds)
    //         e.ttl = moment.duration(e.relativeSeconds * 1000).humanize();
    //     return _.omit(e, ['_id', 'publicKey', 'selectedChannel', 'relativeSeconds']);
    // });

    // if(!data.length)
    //     return { json: { error: true, message: "no data returned?"}};

    // const dot = Object({links: [], nodes: []})
    // dot.links = _.map(data, function(video) { return { target: video.pseudo, source: video.videoId, value: 1} });

    // const vList = _.uniq(_.map(data, function(video) { return video.videoId }));
    // const videoObject = _.map(vList, function(v) { return { id: v, group: 1 }});
    // const pList = _.uniq(_.map(data, function(video) { return video.pseudo }));
    // const pseudoObject = _.map(pList, function(v) { return { id: v, group: 2 }});
    // dot.nodes = _.concat(videoObject, pseudoObject);

    // debug("getSearchesDot: params %d metadataId(s) = %d videos = %d nodes and %d links",
    //     idList.length, data.length, dot.nodes.length, dot.links.length);
    // return { json: dot };
}

async function getSearchKeywords(req) {
    // '/api/v2/search/keywords/:paging?'
    // this returns an unchecked list of USG therefore should be discontinued
    throw new Error("Discontinued"); /*
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
            overflow: (_.size(entries) === MAXRVS),
            skip,
            max: MAXRVS
        }
    }}; */
};

async function getSearchDetails(req) {
    throw new Error("Not yet updated!");
    /* this API is used to ask for individual metadataId, and by a visualization that want to 
     * visualize small snippet in a look-and-feel close to the one of youtube */
    // const ids = req.params.listof.split(',');
    // debug("getSearchDetails got a request for %d searches.metadataId", ids.length);
    // const { structured, info } = await dbutils.compareSearches(nconf.get('schema').searches, ids);
    // debug("Returning %d search results with: %j videos (forced limit of 200 per metadataId)",
    //     _.size(_.keys(structured)), _.values(structured).map(_.size), 
    // );
    // return { json: {
    //     structured,
    //     info,
    // }};
}


module.exports = {
    getSearches,
    getQueries,
    getSearchesDot,
    getSearchesCSV,
    getSearchKeywords,
    getSearchDetails,
};
