const _ = require('lodash');
const debug = require('debug')('lib:dbutils');
const moment = require('moment');
const nconf = require('nconf');

const mongo3 = require('./mongo3');
const utils = require('./utils');

async function checkMongoWorks(beFatal) {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.listCollections(mongoc);
        await mongoc.close();
        return results;
    } catch(error) {
        debug("Failure in checkMongoWorks: %s", error.message);
        if(beFatal) {
            console.log("mongodb is not running: quitting");
            console.log("config derived", nconf.get('mongoDb'));
            process.exit(1);
        }
        return false;
    }
};

async function getLimitedDistinct(cName, field, maxAmount, filter) {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.distinct(mongoc, cName, field, filter);
        await mongoc.close();
        return results;
    } catch(error) {
        debug("Failure in fetching %s by %j: %s: %s", cName, filter, error.message);
        return [];
    }
}

async function getCampaignQuery(campaignColumn, queriesColumn, campaignName, optionalFilter) {
    const MAXAMOUNT = 20000; // maximum amount of search queries looked (hardcoded limit)
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const r = await mongo3.read(mongoc, campaignColumn, { name: campaignName });
        if(!r || !_.size(r) || !r[0]._id ) {
            await mongoc.close();
            return false;
        }

        const campaign = _.first(r);
        debug("getCampaignQuery - campaign retrieved %s, with %d queries", campaign.name, _.size(campaign.queries));
        const filter = {
            searchTerms: { "$in": campaign.queries },
            savingTime: { "$gte": campaign.startDate, "$lte": campaign.endDate }
        };

        if(optionalFilter)
            debug("experimental feature for Dot format: %j", _.extend(filter, optionalFilter) );

        const results = await mongo3.readLimit(mongoc, queriesColumn, optionalFilter ?
            _.extend(filter, optionalFilter) : filter, {}, MAXAMOUNT, 0);
        const refined = _.map(_.groupBy(results, 'searchTerms'), function(qlist, searchTerms) {
            // this is ready for table visualization 
            const rv = {
                id: _.random(0, 0xffff) + "",
                searchTerms,
                searches: _.map(qlist, 'results'),
            };
            rv.total = _.sum(rv.searches);
            return rv;
        });
        debug("getCampaingQuery collected %d term queries, from non-unique source of %d totals %j",
            _.size(refined), _.size(results), _.map(refined, 'total') );
        const contributors = _.size(_.keys(_.countBy(results, 'publicKey')));
        await mongoc.close();
        return {
            selist: refined,
            contributors,
            campaign,
            parameters: {
                maxAmount: MAXAMOUNT,
                retrieved: _.size(results),
                overflow: (_.size(results) == MAXAMOUNT)
        }};
    } catch(error) {
        debug("getCampaignQuery: failure in db access (getCampaignQuery %s): %s", campaignName, error.message);
        // remember, mongoc isn't close in this case, I wonder if many of this condition might trigger any exhaustion
        return false;
    }
}

async function writeCampaigns(cName, listof, kname) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    let retval = [];
    for (o of listof) {
        let r, filter = _.pick(o, [kname]);
        /* debugline is sent back to client as JSON */
        let debugline = 'campaign [' + filter[kname] + ']';
        try {
            r = await mongo3.upsertOne(mongoc, cName, filter, o);
        } catch(error) {
            debugline += " error", error.message;
        }
        if (r.insertedCount)
            debugline += " inserted";
        if (r.upsertedCount)
            debugline += " upserted";
        if (r.matchedCount)
            debugline += " matched";
        if (r.modifiedCount)
            debugline += " modified";
        debug("writeCampaigns: %s", debugline);
        retval.push(debugline);
    }
    await mongoc.close();
    return retval;
}

async function getAggregatedByTerm(cName, campaign, term) {
    // not currently used
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.aggregate(mongoc, cName, [
            { $match: filter },
            { $sort: { "savingTime": -1 } },
            { $limit: maxAmount },
            { $project: { searchTerms: 1, metadataId: 1, savingTime: 1, _id: false } },
            { $group: { _id: "$metadataId", 't': { '$push': '$searchTerms' }, 'amount': { "$sum": 1 } } }
        ]);
        await mongoc.close();
        // debug("Kind reminder you're corrupting input, for example: %s", _.first(results).t);
        return _.reduce(results, function(memo, e) {
            const t = _.first(e.t).replace(/\+/g, ' ');
            const exists = _.find(memo, { t });
            if(exists) {
                exists.searchIds.push(e._id);
                exists.amount += e.amount;
                exists.searches += 1;
            }
            else {
                memo.push({
                    t,
                    id: utils.hash({searchKeyword: t}).substr(0, 8),
                    amount: e.amount,
                    searchIds: [ e._id ],
                    searches: 1
                });
            }
            return memo;
        }, []);
    } catch(error) {
        debug("Failure in fetching %s by %j: %s: %s", cName, filter, error.message);
        return [];
    }
}

async function getLimitedCollection(cName, filter, maxAmount, reportOverflow) {
    // note: sorting only tested for cName === search
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.readLimit(mongoc, cName, filter, {savingTime: -1}, maxAmount, 0);
        if(reportOverflow && _.size(results) === maxAmount) {
            // a db access only for debug sake!
            const full = await mongo3.count(mongoc, cName, filter);
            debug("the maxAmount for this filter is set to %d. full available %d, sorting by most recent",
                maxAmount, full);
        }
        await mongoc.close();
        return results;
    } catch(error) {
        debug("Failure in fetching %s by %j: %s: %s", cName, filter, error.message);
        return [];
    }
}

async function compareSearches(cName, idlist) {
    let mongoc, structured = {}, info = {};
    const maxAmount = 200;
    try {
        mongoc = await mongo3.clientConnect({concurrency: 1});
        for (mid of idlist) {
            const r = await mongo3.readLimit(mongoc, cName, { metadataId: mid }, {}, maxAmount, 0);
            structured[mid] = _.map(r, function(searchResult) {
                const no = _.pick(searchResult, 
                    ['priorityOrder', 'videoId', 'title', 'relativeSeconds', 'currentViews',
                     'selectedAuthor', 'displayLength' ]);
                if(no.relativeSeconds)
                    no.ttl = moment.duration(no.relativeSeconds * 1000).humanize();
                return no;
            });
            info[mid] = {
                savingTime: moment(_.first(r).savingTime).format('YYYY-MM-DD'),
                clang: _.first(r).clang,
                profile: _.first(r).publicKey.substr(5, 5).toLowerCase(),
                searchTerms: _.first(r).searchTerms
            };
        }
    } catch(error) {
        debug("compareSearches: error in database calls: %s", error.message);
    }
    await mongoc.close();
    return { structured, info };
}

module.exports = {
    checkMongoWorks,
    getLimitedDistinct,
    getCampaignQuery,
    writeCampaigns,
    getAggregatedByTerm,
    getLimitedCollection,
    compareSearches,
};
