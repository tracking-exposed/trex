const _ = require('lodash');
const debug = require('debug')('lib:dbutils');
const mongo3 = require('./mongo3');

async function checkMongoWorks() {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        let results = await mongo3.listCollections(mongoc);
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
    getLimitedCollection,
};