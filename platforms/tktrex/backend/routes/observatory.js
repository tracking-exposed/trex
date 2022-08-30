const _ = require('lodash');
const debug = require('debug')('routes:observatory');

const nconf = require('nconf');
const mongo3 = require('@shared/providers/mongo.provider');

async function getCountryFeed(req) {
  const amount = req.params.amount || 4;
  debug('requested %s sample amount %d', req.params.country, amount);
  const samplesAmount = 9 * amount;
  const filter = { countryCode: req.params.country };
  const mongoc = await mongo3.clientConnect();
  const metadata = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').metadata,
    filter,
    { creationTime: -1 },
    samplesAmount,
    0
  );
  await mongoc.close();
  debug(
    'fetched %d videos from %s (samplesAmount %d)',
    _.size(metadata),
    filter.countryCode,
    samplesAmount
  );

  return {
    json: metadata,
  };
}

module.exports = {
  getCountryFeed,
};
