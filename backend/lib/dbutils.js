const _ = require('lodash');
const debug = require('debug')('lib:dbutils');

const mongo3 = require('./mongo3');
const utils = require('./utils');

async function checkMongoWorks() {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.listCollections(mongoc);
        await mongoc.close();
        return results;
    } catch(error) {
        debug("Failure in checkMongoWorks: %s", error.message);
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

async function getCampaignQuery(campaignColumn, queriesColumn, campaignName) {
    const MAXAMOUNT = 2000;
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const r = await mongo3.read(mongoc, campaignColumn, { name: campaignName });
        if(!r || !_.size(r) || !r[0]._id )
            return false;

        const campaign = _.first(r)
        debug("getCampaignQuery - campaign retrieved %s, with %d queries", campaign.name, _.size(campaign.queries));
        const results = await mongo3.readLimit(mongoc, queriesColumn, {
            searchTerms: { "$in": campaign.queries },
            savingTime: { "$gte": campaign.startDate, "$lte": campaign.endDate }
        }, {}, MAXAMOUNT, 0);
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
        debug("getCampaignQuery - failure in db access (getCampaignQuery %s): %s", campaignName, error.message);
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

async function reduceRecentSearches(cName, maxAmount, filter) {
    throw new Error("This should be removed because overriden with new .queries collection");
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
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.readLimit(mongoc, cName, filter, {}, maxAmount, 0);
        await mongoc.close();
        if(reportOverflow && _.size(results) === maxAmount)
            debug("data fetch by %j reach limit of data, sorting isn't configured", filter);
        return results;
    } catch(error) {
        debug("Failure in fetching %s by %j: %s: %s", cName, filter, error.message);
        return [];
    }
}


module.exports = {
    checkMongoWorks,
    getLimitedDistinct,
    getCampaignQuery,
    writeCampaigns,
    reduceRecentSearches,
    getLimitedCollection,
};
