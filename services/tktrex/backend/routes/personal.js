const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const CSV = require('../lib/CSV');
const flattenSearch = require('./search').flattenSearch;

const SEARCH_FIELDS = require('./public').SEARCH_FIELDS;

async function getPersonal(req) {
  // personal API format is
  // /api/v1/personal/:publicKey/:what/:format
  const k = req.params.publicKey;
  if (_.size(k) < 26)
    return {
      json: {
        message: 'Invalid publicKey',
        error: true,
      },
    };

  const amount = _.parseInt(req.query.amount) || 50;
  const skip = _.parseInt(req.query.skip) || 0;
  const what = req.params.what;
  const allowed = ['summary', 'search', 'foryou'];

  if (allowed.indexOf(what) === -1) {
    return {
      json: {
        what,
        allowed,
        error: true,
        details: 'Invalid parameter',
      },
    };
  }

  debug(
    'Asked to get data kind %s (%d-%d), preparing JSON',
    what,
    amount,
    skip
  );
  let retval = null;
  try {
    if (what === 'summary') retval = await automo.getSummaryByPublicKey(k);
    else if (what === 'search') {
      const avail = await automo.getMetadataByFilter(
        { type: 'search', publicKey: k },
        { amount, skip }
      );
      retval = _.map(avail, function (o) {
        return _.pick(o, SEARCH_FIELDS);
      });
    } else if (what === 'foryou')
      retval = await automo.getMetadataByFilter(
        { type: 'foryou', publicKey: k },
        { amount, skip }
      );

    debug('Personal %s returning %d objects', what, retval.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    debug('%s', message);
    return { json: { error: true, message } };
  }

  return { json: retval };
}

async function getPersonalCSV(req) {
  const CSV_MAX_SIZE = 1000;
  const k = req.params.publicKey;
  const data = await automo.getMetadataByFilter(
    { publicKey: k, type: 'search' },
    { amount: CSV_MAX_SIZE, skip: 0 }
  );

  // Search it is using a nested model even if is not what we should
  // use in tiktok.
  const unrolledData = _.reduce(data, flattenSearch, []);
  // console.table(unrolledData);
  const csv = CSV.produceCSVv1(unrolledData);

  debug(
    'getPersonalCSV produced %d entries from %d metadata, %d bytes (max %d)',
    unrolledData.length,
    data.length,
    csv.length,
    CSV_MAX_SIZE
  );
  if (!unrolledData.length)
    return { text: 'Data not found: are you sure any search worked?' };

  const filename =
    'tk-search-' +
    moment().format('YY-MM-DD') +
    '--' +
    unrolledData.length +
    '.csv';
  return {
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
    text: csv,
  };
}

/*
async function removeEvidence(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const id = req.params.id;
    const result = await automo.deleteEntry(k, id);
    debug("Requeste delete of metadataId %s deleted %d video and %d metadata",
        id, _.size(result.videoId), _.size(result.metadata));
    return { json: { success: true, result }};
};
*/

module.exports = {
  getPersonal,
  getPersonalCSV,
};
