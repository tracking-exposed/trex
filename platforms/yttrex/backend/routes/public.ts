import _ from 'lodash';
import moment from 'moment';
import D from 'debug';
import params from '../lib/params';
import automo from '../lib/automo';
import utils from '../lib/utils';
import CSV from '../lib/CSV';
import cache from '../lib/cache';
import * as endpoints from '@shared/endpoints/helper';
import { v1 } from '@yttrex/shared/endpoints';
import structured from '../lib/structured';
const debug = D('routes:public');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

async function getLast(req: Express.Request): Promise<any> {
  if (cache.stillValid('last')) return { json: cache.repullCache('last') };

  // if not initialized or if the cache time is expired: do the query
  const last = await automo.getTransformedMetadata([
    { $match: { title: { $exists: true }, 'related.19': { $exists: true } } },
    { $sort: { savingTime: -1 } },
    { $limit: 1500 },
    { $group: { _id: '$videoId', amount: { $sum: 1 } } },
    { $match: { amount: { $gte: 4 } } },
    {
      $lookup: {
        from: 'metadata',
        localField: '_id',
        foreignField: 'videoId',
        as: 'info',
      },
    },
    { $limit: 20 },
  ]);

  /* the complex entry has nested metadata */
  const reduction = _.map(last, function (ce) {
    const lst = _.last(_.orderBy(ce.info, 'savingTime')).savingTime;
    const d = moment.duration((moment(lst) as any) - (moment() as any));
    const timeago = d.humanize();
    return {
      title: ce.info[0].title,
      authorName: ce.info[0].authorName,
      occurrencies: ce.amount,
      videoId: ce._id,
      timeago,
      secondsago: d.asSeconds(),
    };
  });

  const ready = _.reverse(_.orderBy(reduction, 'secondsago'));
  return {
    json: cache.setCache('last', ready),
    // setCache return cache structure with
    // 'content', 'computedAt',
    // 'next', and 'cacheTimeSeconds'
  };
}

async function getLastHome(): Promise<any> {
  const DEFMAX = 100;

  const homelist = await automo.getMetadataByFilter(
    {
      type: 'home',
      savingTime: { $gte: new Date(moment().startOf('day').toISOString()) },
    },
    {
      amount: DEFMAX,
      skip: 0,
    }
  );

  const rv = _.reduce(
    homelist,
    function (memo, e) {
      const accessId = utils.hash({ who: e.publicKey, when: e.savingTime });
      _.each(e.selected, function (vinfo) {
        const selected = {
          accessId: accessId.substr(0, 10),
          metadataId: e.id,
          order: vinfo.index,
          source: vinfo.recommendedSource,
          title: vinfo.recommendedTitle,
          videoId: vinfo.videoId,
          thumbnailHref: vinfo.thumbnailHref,
          publicationTime: vinfo.publicationTime,
        };
        memo.push(selected);
      });
      return memo;
    },
    [] as any[]
  );

  debug(
    'Returning as getLastHome, %d selected videos from %d evidences',
    _.size(rv),
    _.size(homelist)
  );
  return { json: rv };
}

function ensureRelated(rv): any {
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

async function getVideoId(req): Promise<any> {
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

async function getRelated(req): Promise<any> {
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
    meta.timeago = moment
      .duration(meta.savingTime - (moment() as any))
      .humanize();
    return _.omit(meta, ['_id', 'publicKey']);
  });
  debug(
    'getRelated: returning %d matches about %s',
    _.size(evidences),
    req.params.videoId
  );
  return { json: evidences };
}

async function getVideoCSV(req): Promise<any> {
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

async function getByAuthor(req): Promise<any> {
  /* this API do not return the standard format with videos and related inside,
   * but a data format ready for the visualization provided - this has been
   * temporarly suspended: https://github.com/tracking-exposed/youtube.tracking.exposed/issues/18 */

  /* TODO implement pagination (when overflow is true) */
  const amount = PUBLIC_AMOUNT_ELEMS;
  const skip = 0;

  if (!req.params.videoId.match(/[A-Za-z0-9_-]{11}/))
    throw new Error('Invalid input videoId');

  debug('getByAuthor %s amount %d skip %d', req.params.videoId, amount, skip);
  let authorStruct;
  try {
    const sourceVideo = await structured.getVideo({
      videoId: req.params.videoId,
    });
    authorStruct = await structured.getMetadata(
      {
        authorSource: sourceVideo.authorSource,
      },
      { amount, skip }
    );
    authorStruct = _.merge(
      {
        authorSource: sourceVideo.authorSource,
        authorName: sourceVideo.authorName,
      },
      authorStruct
    );
  } catch (e) {
    debug('getByAuthor error: %s', e.message);
    return {
      json: {
        error: true,
        message: e.message,
      },
    };
  }

  debug(
    'getByAuthor returns %d elements from %s',
    _.size(authorStruct.content),
    authorStruct.authorName
  );
  const { units, ready } = structured.buildRecommFlat(authorStruct);

  debug(
    'Returning byAuthor %d video considered, %d recommendations',
    _.size(authorStruct.content),
    _.size(ready)
  );
  const retval = endpoints.decodeResponse(v1.Public.GetAuthorStatsByVideoId, {
    authorName: authorStruct.authorName,
    authorSource: authorStruct.authorSource.split('/').pop(),
    paging: authorStruct.paging,
    overflow: authorStruct.overflow,
    ...units,
    content: ready,
  });

  if (retval.type === 'error') {
    debug('Invalid generated byAuthor stats! %O', retval);
    return { json: retval };
  }
  return { json: retval.result };
}

export {
  getLast,
  getLastHome,
  getVideoId,
  getRelated,
  getVideoCSV,
  getByAuthor,
};
