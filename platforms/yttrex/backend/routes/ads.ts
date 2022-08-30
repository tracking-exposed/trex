import _ from 'lodash';
import debug from 'debug';
import nconf from 'nconf';
import params from '../lib/params';
import * as mongo3 from '@shared/providers/mongo.provider';
import { Ad } from '@yttrex/shared/models/Ad';

const d = debug('routes:ads');

type AggregationCountResult = Array<
  Pick<Ad, 'sponsoredName' | 'sponsoredSite'> & { count: number }
>;

function aggregationCount(collection): AggregationCountResult {
  /* this function is invoked at the end and group/count
   * the sponsoredName */
  const protorv = _.groupBy(collection, function (e) {
    return _.toLower(
      _.endsWith(e.sponsoredSite, '/')
        ? e.sponsoredSite.replace(/\/$/, '')
        : e.sponsoredSite
    );
  });
  return _.map(protorv, function (listOf, sponsoredSite) {
    return {
      /* not all the ad have a sponsoredName, take the first valid */
      sponsoredName: _.reduce(
        listOf,
        function (memo, ade) {
          return memo ?? ade.sponsoredName;
        },
        null
      ),
      sponsoredSite,
      count: listOf.length,
    };
  });
}

async function advertisingViaMetadata(filter): Promise<any> {
  /* the logic is otherway around compared to the function
   * 'unbound'. We initially pick from metadata and then lookup to
   * ad. this impact the filtering/map function below */
  const mongoc = await mongo3.clientConnect();
  const r = await mongo3.aggregate(
    mongoc as any,
    nconf.get('schema').metadata,
    [
      { $sort: { savingTime: -1 } },
      { $match: filter },
      { $limit: 1000 },
      {
        $lookup: {
          from: 'ads',
          foreignField: 'metadataId',
          localField: 'id',
          as: 'ad',
        },
      },
    ]
  );

  d(
    'looking for metadata by Channel (%j) found %d matches, hardcoded 400 max',
    filter,
    r.length
  );

  await (mongoc as any).close();

  /* because 'ad' is a list with 0 or more AD associated,
   * we need _.compact to remove the absent and then _.flatten */
  return _.flatten(
    _.compact(
      _.map(r, function (metaret) {
        return _.map(metaret.ad, function (ad) {
          return {
            ..._.pick(ad, ['sponsoredName', 'sponsoredSite', 'selectorName']),
            ..._.pick(metaret, [
              'href',
              'authorName',
              'authorSource',
              'title',
              'savingTime',
            ]),
          };
        });
      })
    )
  );
}

async function perVideo(req): Promise<{ json: AggregationCountResult }> {
  const videoId = params.getVideoId(req, 'videoId');
  const filter = { videoId };
  const adlist = await advertisingViaMetadata(filter);
  d('ads by Video (%o), selected results %d', filter, adlist.length);
  return { json: aggregationCount(adlist) };
}

async function perChannel(req): Promise<{
  json: AggregationCountResult | { error: true; message: string };
}> {
  const channelId = params.getString(req, 'channelId');
  const startDate = req.query.since;
  const endDate = req.query.till;

  const filter = {
    savingTime: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    authorSource: { $in: ['/channel/' + channelId, '/c/' + channelId] },
  };
  try {
    if (_.isNaN(filter.savingTime.$gte.valueOf()))
      throw new Error("Invalid 'since' query param " + startDate);
    if (_.isNaN(filter.savingTime.$lte.valueOf()))
      throw new Error("Invalid 'till' query param " + endDate);
  } catch (error) {
    /* The error appears as Date("Invalid Date") and
           .valueOf returns NaN */
    d('Error in date format: %s', error.message);
    return {
      json: {
        error: true,
        message: 'Error in date format, expected YYYY-MM-DD: ' + error.message,
      },
    };
  }
  const adlist = await advertisingViaMetadata(filter);

  d('ads by Channel (%o), selected results %d', filter, adlist.length);
  return { json: aggregationCount(adlist) };
}

async function unbound(req): Promise<{ json: AggregationCountResult }> {
  const max = params.getInt(req, 'amount', 400);
  const mongoc = await mongo3.clientConnect();
  const r = await mongo3.aggregate(mongoc as any, nconf.get('schema').ads, [
    { $sort: { savingTime: -1 } },
    { $limit: max },
    {
      $lookup: {
        from: 'metadata',
        foreignField: 'id',
        localField: 'metadataId',
        as: 'metadata',
      },
    },
  ]);
  d('unbound with max %d returns %d', max, r.length);
  await (mongoc as any).close();

  /* this is the opposite logic of the function above, because
       we are quering by ads */
  const x = _.compact(
    _.map(r, function (adret: any) {
      const rv: any = _.pick(adret, [
        'href',
        'selectorName',
        'sponsoredName',
        'sponsoredSite',
        'savingTime',
      ]);
      if (adret.metadata?.length && adret.metadata[0].type === 'video') {
        rv.authorName = adret.metadata[0].authorName;
        rv.authorSource = adret.metadata[0].authorSource;
        rv.videoTitle = adret.metadata[0].title;
      } else return null;
      return rv;
    })
  );

  return { json: aggregationCount(x) };
}

export { perVideo, perChannel, unbound };
