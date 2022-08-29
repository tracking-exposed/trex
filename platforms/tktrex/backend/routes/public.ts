import createDebug from 'debug';
import _ from 'lodash';
import moment from 'moment';
import automo from '../lib/automo';
import CSV from '../lib/CSV';
import * as params from '../lib/params';

const debug = createDebug('routes:public');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

/*
async function getLast(req) {

    if(cache.stillValid("last"))
        return { json: cache.repullCache('last') };

    // if not initialized or if the cache time is expired: do the query
    const last = await automo.getTransformedMetadata([
        { $match: { title: { $exists: true }, "related.19": { $exists: true } }},
        { $sort: { savingTime: -1 }},
        { $limit: 1500 },
        { $group: { _id: "$videoId", amount: { $sum: 1 }}},
        { $match: { amount: { $gte: 4 }}},
        { $lookup: { from: 'metadata', localField: '_id', foreignField: 'videoId', as: 'info' }},
        { $limit: 20 }
    ]);

    const reduction = _.map(last, function(ce) {
        const lst = _.last(_.orderBy(ce.info, 'savingTime')).savingTime;
        const d = moment.duration( moment(lst) - moment() );
        const timeago = d.humanize();
        return {
            title: ce.info[0].title,
            authorName: ce.info[0].authorName,
            occurrencies: ce.amount,
            videoId: ce._id,
            timeago,
            secondsago: d.asSeconds()
        }
    });

    const ready = _.reverse(_.orderBy(reduction, 'secondsago'));
    return {
        json: cache.setCache('last', ready)
        // setCache return cache structure with
        // 'content', 'computedAt',
        // 'next', and 'cacheTimeSeconds'
    };
};
*/

function ensureRelated(rv: any): null | any {
  /* for each related it is called and only the basic info used in 'compare'
   * page get returned. return 'null' if content is not complete */
  const demanded = [
    'recommendedSource',
    'recommendedTitle',
    'videoId',
    'recommendedDisplayL',
    'verified',
    'index',
  ];
  const sele = _.pick(rv, demanded);
  return _.some(
    _.map(demanded, function (k) {
      return _.isUndefined(sele[k]);
    })
  )
    ? null
    : sele;
}

async function getVideoId(req: any): Promise<any> {
  const { amount, skip } = params.optionParsing(
    req.params.paging,
    PUBLIC_AMOUNT_ELEMS
  );
  debug(
    'getVideoId %s amount %d skip %d default %d',
    req.params.videoId,
    amount,
    skip,
    PUBLIC_AMOUNT_ELEMS
  );

  const entries = await automo.getMetadataByFilter(
    { videoId: req.params.videoId },
    { amount, skip }
  );
  /* this map function ensure there are the approrpiate data (and thus filter out)
   * old content parsed with different format */

  const evidences = _.compact(
    _.map(entries, function (meta) {
      meta.related = _.reverse(_.compact(_.map(meta.related, ensureRelated)));
      if (!_.size(meta.related)) return null;
      _.unset(meta, '_id');
      _.unset(meta, 'publicKey');
      return meta;
    })
  );
  debug(
    'getVideoId: found %d matches about %s',
    _.size(evidences),
    req.params.videoId
  );
  return { json: evidences };
}

async function getRelated(req: any): Promise<any> {
  const { amount, skip } = params.optionParsing(
    req.params.paging,
    PUBLIC_AMOUNT_ELEMS
  );
  debug(
    "getRelated %s query directly 'related.videoId'. amount %d skip %d",
    req.params.videoId,
    amount,
    skip
  );
  const entries = await automo.getMetadataByFilter(
    { 'related.videoId': req.params.videoId },
    { amount, skip }
  );
  const evidences = _.map(entries, function (meta) {
    meta.related = _.map(meta.related, function (e) {
      return _.pick(e, [
        'recommendedTitle',
        'recommendedSource',
        'index',
        'foryou',
        'videoId',
      ]);
    });
    meta.timeago = moment.duration(meta.savingTime - +moment()).humanize();
    return _.omit(meta, ['_id', 'publicKey']);
  });
  debug(
    'getRelated: returning %d matches about %s',
    _.size(evidences),
    req.params.videoId
  );
  return { json: evidences };
}

async function getVideoCSV(req: any): Promise<any> {
  // /api/v1/videoCSV/:videoId/:amount
  const MAXENTRY = 2800;
  const { amount, skip } = params.optionParsing(req.params.paging, MAXENTRY);
  debug(
    'getVideoCSV %s, amount %d skip %d (default %d)',
    req.params.videoId,
    amount,
    skip,
    MAXENTRY
  );
  const byrelated = await automo.getRelatedByVideoId(req.params.videoId, {
    amount,
    skip,
  });
  const csv = CSV.produceCSVv1(byrelated);
  const filename =
    'video-' + req.params.videoId + '-' + moment().format('YY-MM-DD') + '.csv';
  debug('VideoCSV: produced %d bytes, returning %s', _.size(csv), filename);

  if (!_.size(csv)) return { text: 'Error, Zorry: 🤷' };

  return {
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
    text: csv,
  };
}

async function getRecent(req: any): Promise<any> {
  // this still to be determined why was supposed to be implemented: perhaps 'compare' equivalent?
  return { json: { fuffa: true } };
}

const SEARCH_FIELDS = ['id', 'query', 'publicKey', 'savingTime'];
/* this is exported because also used in personal */
async function getSearches(req: any): Promise<any> {
  const amount = _.parseInt(req.query.amount) || 50;
  const skip = _.parseInt(req.query.skip) || 0;
  // this support the 'standard' format for Taboule
  const retval = await automo.getMetadataByFilter(
    { type: 'search' },
    { amount, skip }
  );
  const filtered = _.flatten(
    _.map(retval, function (o) {
      const core = _.pick(o, SEARCH_FIELDS);
      return _.map(o.results, function (r) {
        return {
          ...r,
          ...core,
        };
      });
    })
  );
  return { json: filtered };
}

export {
  getVideoId,
  getRelated,
  getVideoCSV,
  getRecent,
  SEARCH_FIELDS,
  getSearches,
};
