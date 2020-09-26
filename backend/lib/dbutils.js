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

async function reduceRecentSearches(cName, maxAmount, filter) {
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
    reduceRecentSearches,
    getLimitedCollection,
};