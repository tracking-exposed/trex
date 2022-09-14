import _ from 'lodash';
import moment from 'moment';
import nconf from 'nconf';

import utils from '../lib/utils';
import automo from '../lib/automo';
import CSV from '../lib/CSV';
import * as mongo from '@shared/providers/mongo.provider';
import { SEARCH_FIELDS } from './public';

import D from 'debug';
const debug = D('routes:search');

export function flattenSearch(memo, metasearch) {
  // function invoked to depack and flatten metadata {type: search}
  // to produce CSV.

  _.each(metasearch.results || [], function (result, order) {
    const thumbfile =
      metasearch.thumbnails && metasearch.thumbnails.length
        ? metasearch.thumbnails[order]?.filename
        : null;
    const readyo = {
      ...result.video,
      // @ts-ignore
      publishingDate: result.publishingDate,
      // @ts-ignore
      order: result.order,
      // @ts-ignore
      tags: _.compact(
        _.map(result.linked, function (link) {
          return link?.link?.type === 'tag' ? link.desc : null;
        })
      ).join(', '),
      // @ts-ignore
      metadataId: metasearch.id,
      // @ts-ignore
      savingTime: moment(metasearch.savingTime).format('YYYY-MM-DD HH:mm'),
      // @ts-ignore
      timeago: moment
        .duration(moment(metasearch.savingTime) - moment())
        .humanize(true),
      // @ts-ignore
      publicKey: metasearch.publicKey,
      // @ts-ignore
      query: metasearch.query,
      // @ts-ignore
      textdesc: result.textdesc,
      // @ts-ignore
      thumbfile: thumbfile ? thumbfile.replace(/(.*\/)|(.*\\)/, '') : null,
    };
    readyo.videoId = '' + readyo.videoId;
    // @ts-ignore
    memo.push(readyo);
  });
  return memo;
}

export function flattenProfile(memo, metaprofile) {
  // function invoked to depack and flatten metadata {type: search}
  // to produce CSV.

  _.each(metaprofile.results || [], function (result, order) {
    /* TODO 
    const thumbfile =
      metaprofile.thumbnails && metaprofile.thumbnails.length
        ? metaprofile.thumbnails[order]?.filename
        : null; */
    const readyo = {
      ...result.video,
      // @ts-ignore
      profileName: metaprofile.creatorName,
      // @ts-ignore
      views: result.views,
      // @ts-ignore
      title: result.title,
      // @ts-ignore
      order: order + 1,
      // @ts-ignore
      metadataId: metaprofile.id,
      // @ts-ignore
      savingTime: moment(metaprofile.savingTime).format('YYYY-MM-DD HH:mm'),
      // @ts-ignore
      publicKey: metaprofile.publicKey,
      // @ts-ignore
      href:
        'https://www.tiktok.com/@' +
        metaprofile.creatorName +
        '/video/' +
        result.video.videoId,
      // @ts-ignore
      /* thumbfile: thumbfile ? thumbfile.replace(/(.*\/)|(.*\\)/, '') : null, */
    };
    _.unset(readyo, 'authorId');
    readyo.videoId = ' ' + readyo.videoId;
    // @ts-ignore
    memo.push(readyo);
  });
  return memo;
}

export function flattenNative({
  nature,
  music,
  author,
  metrics,
  hashtags,
  downloader,
  ...datum
}) {
  return {
    ...datum,
    music_url: music.url,
    music_title: music.title,
    ...metrics,
    hashtags: hashtags.join(' '),
  };
}

export async function getSearchByQuery(req) {
  // /api/v2/query/<param>/<json|csv>

  const amount = 200;
  const skip = 0;
  const query = req.params.string;
  if (!query || !query.length) {
    return { text: 'error, /query/<string>/<json|csv>' };
  }
  const format = req.params.format === 'csv' ? 'csv' : 'json';

  const found = await automo.getMetadataByFilter({ query }, { amount, skip });
  const unrolledData = _.reduce(found, flattenSearch, []);

  /* XXX TMP FIXME (not if we pick the pseudo via mongodb) 
     sanitization & enhancement:
    1) we add here the pseudonym
    2) if a string appears in a metric, it is 0 -- this is a parser bug */
  const ready = _.map(unrolledData, function (e) {
    e.pseudo = utils.string2Food(e.publicKey);
    _.unset(e, 'publicKey');
    if (_.isString(e.sharen)) e.sharen = 0;
    return e;
  });

  debug(
    'found for query %s: %d entries from %d metadata. returning %s',
    query,
    ready.length,
    found.length,
    format
  );

  if (format === 'csv') {
    const csv = CSV.produceCSVv1(ready);
    const filename =
      'query-' +
      query +
      '-' +
      ready.length +
      '--' +
      moment().format('YY-MM-DD') +
      '.csv';
    debug('found: produced %d bytes, returning %s', _.size(csv), filename);

    if (!_.size(csv)) return { text: 'Error, Missing actual data: 🤷' };

    return {
      headers: {
        'Content-Type': 'csv/text',
        'Content-Disposition': 'attachment; filename=' + filename,
      },
      text: csv,
    };
  } else {
    return {
      json: ready,
    };
  }
}

export async function getQueryList(req) {
  // /api/v2/queries/list
  // TODO support the queries that returned only errors?

  const lastWeek = moment().subtract(3, 'week').startOf('day').toISOString();
  const mongoc = await mongo.clientConnect();
  const toomanyqueries = await mongo.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    [
      {
        $match: {
          type: 'search',
          savingTime: { $gte: new Date(lastWeek) },
          'results.1': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$query',
          amount: { $sum: 1 },
          from: { $push: '$publicKey' },
        },
      },
      { $match: { 'from.1': { $exists: true } } },
    ]
  );
  // they are too many because it lack of the check if the query
  // have been performed in fact by at least two browsers
  await mongoc.close();

  const queries = _.filter(toomanyqueries, function (q) {
    return _.uniq(q.from).length > 1;
  });

  debug('Found %d query names', queries.length);
  return { json: _.sortBy(_.map(queries, '_id'), 'Asc') };
}

export async function getSearches(req) {
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

module.exports = {
  getSearchByQuery,
  getQueryList,
  flattenSearch,
  flattenProfile,
  flattenNative,
};
