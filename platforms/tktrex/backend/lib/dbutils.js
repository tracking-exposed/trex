const _ = require('lodash');
const debug = require('debug')('lib:dbutils');
const nconf = require('nconf');

const mongo3 = require('@shared/providers/mongo.provider');

async function checkMongoWorks(beFatal) {
  try {
    const mongoc = await mongo3.clientConnect({});
    const results = await mongo3.listCollections(mongoc);
    debug('collection list: %j', _.map(results, 'name'));
    await mongoc.close();
    return results;
  } catch (error) {
    if (!(error instanceof Error)) {
      debug('checkMongoWorks: %s', error);
      return false;
    }

    debug('Failure in checkMongoWorks: %s', error.message);
    // eslint-disable-next-line no-console
    console.log(error.stack);
    if (beFatal) {
      // eslint-disable-next-line no-console
      console.log('mongodb is not running: quitting');
      // eslint-disable-next-line no-console
      console.log('config derived', nconf.get('mongoDb'));
      process.exit(1);
    }
    return false;
  }
}

module.exports = {
  checkMongoWorks,
};
