const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const automo = require('../lib/automo');
const CSV = require('../lib/CSV');
const flattenSearch = require('./search').flattenSearch;

const SEARCH_FIELDS = require('./public').SEARCH_FIELDS;

function pickFeedFields(metae) {
  return {
    authorName: metae.author?.name,
    authorUser: metae.author?.username,
    id: metae.id,
    description: metae.description,
    tags: metae.hashtags?.join(',') || '',
    ...metae.metrics,
    musicURL: metae?.music?.url || null,
    musicTitle: metae?.music?.name || null,
    publicKey: metae.publicKey,
    savingTime: metae.savingTime,
    hasStitch: !!_.get(metae, 'stitch', false),
  };
}

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
  const type = req.params.what;
  if (['foryou', 'search', 'following'].indexOf(type) === -1)
    return { text: 'Error, only foryou and search is supported ' };

  const data = await automo.getMetadataByFilter(
    { publicKey: k, type },
    { amount: CSV_MAX_SIZE, skip: 0 }
  );

  /* remind self, search has a different logic than for you,
     this is why is a reduce instead of map */
  let unrolledData = [];
  if (type === 'search') unrolledData = _.reduce(data, flattenSearch, []);
  else unrolledData = _.map(data, pickFeedFields);

  // console.table(unrolledData);
  const csv = CSV.produceCSVv1(unrolledData);

  debug(
    'getPersonalCSV produced %d entries from %d metadata (type %s), %d bytes (max %d)',
    unrolledData.length,
    data.length,
    csv.length,
    type,
    CSV_MAX_SIZE
  );
  if (!unrolledData.length)
    return { text: 'Data not found: are you sure any search worked?' };

  const filename =
    'tk-' +
    type +
    '-' +
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
  pickFeedFields,
  getPersonal,
  getPersonalCSV,
};
