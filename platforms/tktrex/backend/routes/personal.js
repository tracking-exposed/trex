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
    savingTime: metae.savingTime,
    order: metae.order,
    refreshId: metae.timelineId,
    description: metae.description,
    tags: metae.hashtags?.join(', ') || '',
    ...metae.metrics,
    musicURL: metae?.music?.url || null,
    musicTitle: metae?.music?.name || null,
    hasStitch: !!_.get(metae, 'stitch', false),
    publicKey: metae.publicKey,
    id: metae.id,
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

  if (!unrolledData.length) {
    debug('getPersonalCSV return empty data');
    return { text: 'Data not found: are you sure any search worked?' };
  }

  /* XXX TMP FIXME (not if we pick the pseudo via mongodb) 
     sanitization & enhancement:
    1) we add here the pseudonym
    2) if a string appears in a metric, it is 0 -- this is a parser bug */
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
