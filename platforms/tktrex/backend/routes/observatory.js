const _ = require('lodash');
const debug = require('debug')('routes:observatory');

const nconf = require('nconf');
const mongo3 = require('../lib/mongo3');

async function getCountryFeed(req) {
  debug('requested %s', req.params.country);

  const MAX = 9 * 4;
  const filter = { countryCode: req.params.country };
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const metadata = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').metadata,
    filter,
    { creationTime: -1 },
    MAX,
    0
  );
  await mongoc.close();
  debug('fetched %d videos from %s', _.size(metadata), filter.countryCode);

  return {
    json: metadata,
  };
}

module.exports = {
  getCountryFeed,
};
