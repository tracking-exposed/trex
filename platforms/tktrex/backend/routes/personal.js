const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:personal');

const utils = require('../lib/utils');
const automo = require('../lib/automo');
const CSV = require('../lib/CSV');
const flattenSearch = require('./search').flattenSearch;

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
    pseudo: utils.string2Food(metae.publicKey),
    publicKey: metae.publicKey,
    savingTime: metae.savingTime,
    hasStitch: !!_.get(metae, 'stitch', false),
  };
}

async function getPersonal(req) {
  // personal API format is
  // /api/v1/personal/:publicKey/:what/:format
  const k = req.params.publicKey;

  const amount = _.parseInt(req.query.amount) || 50;
  const skip = _.parseInt(req.query.skip) || 0;
  const what = req.params.what;
  const allowed = ['summary', 'search', 'foryou', 'following'];

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

  try {
    let filter;
      let retval = null;

    if (what === 'summary') {
      filter = { type: { $in: ['following', 'foryou'] } };
      retval = await automo.getPersonalTableData(k, filter, { amount, skip });
    } else if (what === 'search') {
      /* this function access to 'search' results which is a
       * bit different than the other. as in the collection
       * there is not one entry for video, but one entry for search
       * query --> hence, the _.map/_.pick
       * note, this data should match
       * packages/shared/src/models/contributor/ContributorPersonalSummary.ts
       */
      const avail = await automo.getPersonalTableData(
        k,
        { type: 'search' },
        { amount, skip }
      );
      const metadata = _.map(avail.metadata, function (o) {
        const smf = _.pick(o, ['id', 'query', 'savingTime']);
        smf.rejected = !!o.message?.length;
        smf.results = o.results?.length || 0;
        smf.sources = _.uniq(
          _.map(o.results || [], function (v) {
            return v.video.authorId;
          })
        );
        return smf;
      });
      retval = {
        counters: { metadata: avail.counters?.metadata },
        metadata,
      };
    } else if (what === 'foryou' || what === 'following') {
      retval = await automo.getMetadataByFilter(
        { type: what, publicKey: k },
        { amount, skip }
      );
      retval = _.map(retval, function (e) {
        e.pseudo = utils.string2Food(e.publicKey);
        _.unset(e, 'publicKey');
        return e;
      });
    } else {
      throw new Error('Invalid and unsupported request type');
    }

    return { json: retval };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    debug('getPersonal handled error: %s', message);
    return { json: { error: true, message } };
  }
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
