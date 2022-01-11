import _ from 'lodash';
import moment from 'moment';

import * as params from '../lib/params';
import automo from '../lib/automo';
import CSV from '../lib/CSV';
import cache from '../lib/cache';
import mongo from '../lib/mongo3';

import D from 'debug';
const debug = D('routes:search');

export function flattenSearch(memo, metasearch) {
  // function invoked to depack and flatten metadata {type: search}
  // to produce CSV.

  _.each(metasearch.results || [], function (result, order) {
    const thumbfile = metasearch.thumbnails[order]?.filename;
    const readyo = {
      ...result.video,
      // @ts-ignore
      order: result.order,
      // @ts-ignore
      tags: _.map(
        _.filter(result.linked, function (link) {
          return link.link.type === 'tag';
        }),
        'link.hashtag'
      ).join(','),
      // @ts-ignore
      metadataId: metasearch.id,
      // @ts-ignore
      savingTime: metasearch.savingTime,
      // @ts-ignore
      publicKey: metasearch.publicKey,
      // @ts-ignore
      query: metasearch.query,
      // @ts-ignore
      textdesc: result.textdesc,
      // @ts-ignore
      thumbfile: thumbfile.replace(/(.*\/)|(.*\\)/, ''),
    };
    readyo.videoId = '' + readyo.videoId;
    // @ts-ignore
    memo.push(readyo);
  });
  return memo;
}

export async function getSearchByQuery(req) {
  // /api/v2/query/<param>/<json|csv>

  const amount = 200;
  const skip = 0;
  const query = req.params.string;
  if(!query || !query.length) {
    return { text: "error, /query/<string>/<json|csv>" };
  }
  const format = req.params.format === 'csv' ? 'csv' : 'json';

  const found = await automo
    .getMetadataByFilter({ query }, { amount, skip, });
  const unrolledData = _.reduce(found, flattenSearch, []);

  debug("found for query %s: %d entries from %d metadata. returning %s",
    query, unrolledData.length, found.length, format);

  if(format === 'csv') {
    const csv = CSV.produceCSVv1(unrolledData);
    const filename =
      'query-' + query + '-' + unrolledData.length + '--' + moment().format('YY-MM-DD') + '.csv';
    debug('found: produced %d bytes, returning %s', _.size(csv), filename);

    if (!_.size(csv))
      return { text: 'Error, Missing actual data: 🤷' };

    return {
      headers: {
        'Content-Type': 'csv/text',
        'Content-Disposition': 'attachment; filename=' + filename,
      },
      text: csv,
    };
  } else {
    return {
      json: unrolledData
    }
  }
}

export async function getQueryList(req) {
  // /api/v2/queries/list

  const mongoc = await mongo.clientConnect({concurrency: 1});
  const queries = await mongo.distinct(mongoc, nconf.get('schema').metadata, 'query');
  await mongoc.close();

  debug("found %d query names");
  return { json: queries };
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
};
