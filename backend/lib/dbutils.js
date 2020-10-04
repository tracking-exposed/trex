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
        let filter = await mongo3.read(mongoc, campaignColumn, {campaignName });
        debug("filter retrieved %j", filter);
        filter = [ 'link4universe spaceX', 'trump biden face to face' ];
        const results = await mongo3.readLimit(mongoc, queriesColumn, { searchTerms: { "$in": filter }}, {}, MAXAMOUNT, 0);
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
        return { selist: refined,
            contributors,
            parameters: {
                maxAmount: MAXAMOUNT,
                retrieved: _.size(results),
                overflow: (_.size(results) == MAXAMOUNT)
        }};
    } catch(error) {
        debug("Failure in db access (getCampaignQuery %s): %s", campaignName, error.message);
        return false;
    }
}


async function upsertMany(cName, listof, kname) {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        for (o of listof) {
            let filter = _.pick(o, [kname]);
            debug("filter %j", filter);
            let r = await mongo3.upsertOne(mongoc, cName, o, filter );
            console.log(r);
        }
        await mongoc.close();
    } catch(error) {
        debug("%j", error);
        return false;
    }
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
    upsertMany,
    reduceRecentSearches,
    getLimitedCollection,
};
