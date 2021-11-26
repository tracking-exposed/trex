const _ = require('lodash');
const debug = require('debug')('lib:dbutils');
const nconf = require('nconf');

const mongo3 = require('./mongo3');

async function checkMongoWorks(beFatal) {
    try {
        const mongoc = await mongo3.clientConnect({concurrency: 1});
        const results = await mongo3.listCollections(mongoc);
        debug("collection list: %j", results);
        await mongoc.close();
        return results;
    } catch(error) {
        debug("Failure in checkMongoWorks: %s", error.message);
        console.log(error.stack);
        if(beFatal) {
            console.log("mongodb is not running: quitting");
            console.log("config derived", nconf.get('mongoDb'));
            process.exit(1);
        }
        return false;
    }
};

module.exports = {
    checkMongoWorks,
};
