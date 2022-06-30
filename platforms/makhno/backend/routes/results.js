const _ = require('lodash');
const debug = require('debug')('routes:personal');
const nconf = require('nconf');

const utils = require('../lib/utils');
const mongo = require('../lib/mongo3');
const CSV = require('../lib/CSV');

async function getDebugInfo(req) {
  return { json: {
    error: true,
    messasge: 'Not implemented yet'
  }};
}
async function getResults(req) {
  // personal API format is
  // /api/v1/results/:urlpattern?
  const up = req.params.urlpattern;
  const options = { amount: 100, skip: 0 };
  debug('Requested results for [%s]', up);

  try {
  
    const mongoc = await mongo.clientConnect({concurrency: 1});
    const results = await mongo.readLimit(mongoc,
      nconf.get('schema').results, { urlId: up }, { savingTime: -1 },
      options.amount, options.skip);
    const runs = await mongo.readLimit(mongoc,
      nconf.get('schema').runs, { urlId: up}, { savingTime: -1},
      options.amount, options.skip);
    await mongoc.close();

    if(!results && !runs)
      return {
        json: { success: false, error: "This test do not seem scheduled for a test" }
      }

    debug("%j", runs);
    // else we'll have material to display
    return { json: {
      success: true, 
      runs,
      results: results
    } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    debug('getPersonal handled error: %s', message);
    return { json: {
      success: false,
      message
    } };
  }
}

/*
async function getPersonalCSV(req) {
  const CSV_MAX_SIZE = 9000;
  const k = req.params.publicKey;
  const type = req.params.what;

  if (['foryou', 'search', 'following', 'profile'].indexOf(type) === -1)
    return { text: 'Error, nature not supported ' };

  const data = await automo.getMetadataByFilter(
    { publicKey: k, type },
    { amount: CSV_MAX_SIZE, skip: 0 }
  );

  if (!data.length) {
    debug("getPersonalCSV didn't found DB entry matching %o", {
      publicKey: k,
      type,
    });
    return { text: 'No data not found in the DB' };
  }

  debug(
    'type [%s] return %d with amount %d skip-zero',
    type,
    data.length,
    CSV_MAX_SIZE
  );

  if (type === 'search') unrolledData = _.reduce(data, flattenSearch, []);
  else if (type === 'profile')
    unrolledData = _.reduce(data, flattenProfile, []);
  else unrolledData = _.map(data, pickFeedFields);

  if (!unrolledData.length) {
    debug(
      'getPersonalCSV produced empty data during transformation: investigate parsers and pipeline!'
    );
    return { text: 'Data not found, from metadata: ' + data.length };
  }

  const pseudo = utils.string2Food(unrolledData[0].publicKey);
  const ready = _.map(unrolledData, function (e) {
    e.pseudo = pseudo;
    if (_.isString(e.sharen)) e.sharen = 0;
    return e;
  });

  // console.table(ready);
  const csv = CSV.produceCSVv1(ready);

  debug(
    'getPersonalCSV produced %d entries from %d metadata (type %s), %d bytes (max %d)',
    ready.length,
    data.length,
    type,
    csv.length,
    CSV_MAX_SIZE
  );

  const filename =
    'tk-' +
    type +
    '-' +
    moment().format('YY-MM-DD') +
    '--' +
    ready.length +
    '.csv';

  return {
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
    text: csv,
  };
}
*/

module.exports = {
  getDebugInfo,
  getResults,
  // getPersonalCSV,
};
