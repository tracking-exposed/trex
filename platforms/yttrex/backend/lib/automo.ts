/* automo.js means "automongo".
 * This library should be included most of the time, because implement high level functions about mongodb access.
 * all the functions implemented in routes, libraries, and whatsoever, should be implemented here.
 *
 * The module mongo3.js MUST be used only in special cases where concurrency wants to be controlled
 *
 * This file grows too much and expecially it fail its pourpose. Because if we need to have here an high-level
 * mongo library, now it is nonsensical so much application logic from routes and API falled here. This might
 * demand a rewriting, especially because this library is copied in amazon.tracking.exposed and pornhub.tracking.exposed
 * and so all the trex derived works beside facebook.tracking.exposed (which as first prototype had a slightly different
 * approach).
 *
 * In the long term the refactor would lead also to unite the parser in one package and manage domain (.com's) and
 * project (config/settings.json) as variables.
 */
import { CreatorStatContent, CreatorStats } from '@shared/models/CreatorStats';
import { GetDirectiveOutput } from '@shared/models/Experiment';
import { Step } from '@shared/models/Step';
import * as mongo3 from '@shared/providers/mongo.provider';
import {
  ParsedInfo,
  VideoMetadata,
} from '@yttrex/shared/models/metadata/Metadata';
import { NatureType } from '@yttrex/shared/models/Nature';
import { Supporter } from '@yttrex/shared/models/Supporter';
import { differenceInSeconds, formatDistance } from 'date-fns';
import D from 'debug';
import _ from 'lodash';
import { Ad } from '../models/Ad';
import moment from 'moment';
import { DeleteResult, Filter, MongoClient } from 'mongodb';
import nconf from 'nconf';
import utils from '../lib/utils';
import { Experiment } from '../models/Experiment';
import { HTML } from '../models/HTML';
import { MetadataDB } from '../models/metadata';
import { SearchMetadataDB } from '../models/metadata/SearchMetadata';

const debug = D('lib:automo');

async function getSupporterByPublicKey(publicKey): Promise<Supporter> {
  const mongoc = await mongo3.clientConnect();
  const supporter = await mongo3.readOne(
    mongoc,
    nconf.get('schema').supporters,
    { publicKey }
  );
  await mongoc?.close();
  return supporter;
}

async function getSummaryByPublicKey(publicKey, options): Promise<any> {
  /* this function return the basic information necessary to compile the
       landing personal page */
  const mongoc = await mongo3.clientConnect();

  const supporter = await getSupporterByPublicKey(publicKey);

  if (!supporter || !supporter.publicKey)
    throw new Error('Authentication failure');

  const metadata = await mongo3.readLimit<MetadataDB>(
    mongoc,
    nconf.get('schema').metadata,
    { publicKey: supporter.publicKey },
    { savingTime: -1 },
    options.amount,
    options.skip
  );

  const total = await mongo3.count(mongoc, nconf.get('schema').metadata, {
    publicKey: supporter.publicKey,
  });

  const ads = await mongo3.readLimit<Ad>(
    mongoc,
    nconf.get('schema').ads,
    { publicKey: supporter.publicKey },
    { savingTime: -1 },
    options.amount,
    options.skip
  );

  await mongoc?.close();

  debug(
    'Retrieved in getSummaryByPublicKey: metadata %d, total %d and ads %d (amount %d skip %d)',
    _.size(metadata),
    total,
    ads.length,
    options.amount,
    options.skip
  );

  const stats = _.countBy(metadata, 'type');
  const cleanedads = _.map(ads, function (ad) {
    return _.pick(ad, [
      'href',
      'metadataId',
      'sponsoredSite',
      'sponsoredName',
      'savingTime',
    ]);
  });
  const videof = [
    'id',
    'videoId',
    'savingTime',
    'title',
    'authorName',
    'authorSource',
    'publicationTime',
  ];
  const homef = ['id', 'savingTime'];
  const searchf = ['id', 'savingTime', 'query'];
  const payload = _.reduce(
    metadata,
    function (memo, entry) {
      if (entry.type === 'home') {
        memo.homes.push({
          ..._.pick(entry, homef),
          selected: _.map(entry.selected, 'recommendedTitle'),
        });
      } else if (entry.type === 'video') {
        memo.videos.push({
          ..._.pick(entry, videof),
          relatedN: entry.related.length,
          relative: formatDistance(entry.savingTime, new Date()),
        });
      } else if (entry.type === 'search') {
        memo.searches.push({
          ..._.pick(entry, searchf),
          results: entry.results.length,
        });
      }
      return memo;
    },
    {
      homes: [] as any[],
      videos: [] as any[],
      searches: [] as any[],
    }
  );

  return {
    supporter,
    ...payload,
    total,
    stats,
    ads: cleanedads,
  };
}

async function getMetadataByPublicKey(
  publicKey,
  options
): Promise<{ supporter: Supporter; metadata: SearchMetadataDB[] }> {
  const mongoc = await mongo3.clientConnect();
  const supporter = await mongo3.readOne(
    mongoc,
    nconf.get('schema').supporters,
    { publicKey }
  );

  if (!supporter) throw new Error('publicKey do not match any user');

  const filter = {
    publicKey: supporter.publicKey,
    type: options.type,
  };

  if (!options.type)
    debug("Missing 'type': this API might not work as expected");

  if (options.timefilter)
    _.set(filter, 'savingTime.$gte', new Date(options.timefilter));

  const metadata = await mongo3.readLimit<SearchMetadataDB>(
    mongoc,
    nconf.get('schema').metadata,
    filter,
    { savingTime: -1 },
    options.amount,
    options.skip
  );

  await mongoc?.close();

  debug(
    'Retrieved in getMetadataByPublicKey: %d metadata (filter %j)',
    _.size(metadata),
    filter
  );
  return {
    supporter,
    metadata,
  };
}

async function getMetadataByFilter(
  filter: Filter<MetadataDB>,
  options: { amount: number; skip: number }
): Promise<{
  data: MetadataDB[];
  totals: { [K in NatureType]: number };
}> {
  const mongoc = await mongo3.clientConnect();

  const totalVideo = await mongo3.count(mongoc, nconf.get('schema').metadata, {
    ...filter,
    type: 'video',
  });

  const totalSearch = await mongo3.count(mongoc, nconf.get('schema').metadata, {
    ...filter,
    type: 'search',
  });

  const totalHome = await mongo3.count(mongoc, nconf.get('schema').metadata, {
    ...filter,
    type: 'home',
  });

  // const totalHashtag = await mongo3.count(
  //   mongoc,
  //   nconf.get('schema').metadata,
  //   {
  //     ...filter,
  //     type: 'hashtag',
  //   }
  // );

  const metadata = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').metadata,
    filter,
    { savingTime: -1 },
    options.amount,
    options.skip
  );

  await mongoc?.close();
  return {
    totals: {
      video: totalVideo,
      search: totalSearch,
      home: totalHome,
      hashtag: 0,
      channel: 0,
    },
    data: metadata,
  };
}

async function getMetadataFromAuthor(filter, options): Promise<CreatorStats> {
  const mongoc = await mongo3.clientConnect();

  const sourceVideo = await mongo3.readOne(
    mongoc,
    nconf.get('schema').metadata,
    filter
  );

  if (!sourceVideo || !sourceVideo.id)
    throw new Error('Video not found, invalid videoId');

  const videos = await mongo3.readLimit<CreatorStatContent>(
    mongoc,
    nconf.get('schema').metadata,
    { authorSource: sourceVideo.authorSource },
    { savingTime: -1 },
    options.amount,
    options.skip
  );

  const total = await mongo3.count(mongoc, nconf.get('schema').metadata, {
    authorSource: sourceVideo.authorSource,
  });

  await mongoc?.close();
  return {
    content: videos,
    overflow: _.size(videos) === options.amount,
    total,
    pagination: options,
    authorName: sourceVideo.authorName,
    authorSource: sourceVideo.authorSource,
    stripped: undefined,
  };
}

async function getMetadataFromAuthorChannelId(
  channelId,
  options
): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const filter = {
    authorSource: { $in: [`/channel/${channelId}`, `/c/${channelId}`] },
    authorName: { $ne: null },
    'related.0': { $exists: true },
  };

  const cappedResultsOpts = [
    { $match: filter },
    { $project: { _id: false, authorName: true, related: true } },
    { $unwind: '$related' },
    {
      $group: {
        _id: '$related.recommendedSource',
        recommendedChannelCount: { $sum: 1 },
        queryAuthorName: { $first: '$authorName' },
      },
    },
    { $sort: { recommendedChannelCount: -1 } },
    { $skip: options.skip },
    { $limit: options.amount },
  ];

  const results = await mongo3.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    cappedResultsOpts
  );

  const totalRelatedCountFilters = [
    {
      $match: filter,
    },
    { $project: { id: true, related: true } },
    { $group: { _id: 'id', total: { $sum: { $size: '$related' } } } },
  ];

  const [relatedTotal] = await mongo3.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    totalRelatedCountFilters
  );

  const [totalRecommendedSource] = await mongo3.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    [
      { $match: filter },
      { $project: { _id: false, related: true } },
      { $unwind: '$related' },
      {
        $group: {
          _id: '$related.recommendedSource',
        },
      },
      { $count: 'total' },
    ]
  );

  if (results.length === 0) {
    return {
      channelId,
      authorName: null,
      totalRecommendations: totalRecommendedSource?.total ?? 0,
      totalContributions: relatedTotal?.total ?? 0,
      score: 0,
      pagination: options,
      content: [],
    };
  }

  await mongoc.close();

  const content = results.map((r) => ({
    ...r,
    recommendedSource: r._id,
    percentage: Math.round(
      (100 / relatedTotal.total) * r.recommendedChannelCount
    ),
  }));

  const authorName = _.first(content).queryAuthorName;
  const isPresent = _.find(content, { _id: authorName });
  const score = isPresent ? isPresent.percentage : 0;

  const result = {
    channelId,
    authorName,
    totalRecommendations: totalRecommendedSource.total,
    totalContributions: relatedTotal.total,
    score,
    pagination: options,
    content,
  };

  return result;
}

async function getVideosByPublicKey(
  publicKey,
  filter,
  htmlToo
): Promise<{ metadata: VideoMetadata[]; html: HTML[] }> {
  // refactor: this was a double purpose API but actually has only one pourpose. htmlToo should never be true here
  const mongoc = await mongo3.clientConnect();

  const supporter = await mongo3.readOne(
    mongoc,
    nconf.get('schema').supporters,
    { publicKey }
  );
  if (!supporter) throw new Error('publicKey do not match any user');

  const selector = _.set(filter, 'publicKey', supporter.publicKey);
  debug('getVideosByPublicKey with flexible selector (%j)', filter);
  const metadata = await mongo3.read(
    mongoc,
    nconf.get('schema').metadata,
    selector,
    { savingTime: -1 }
  );
  const ret = { html: [] as any[], metadata };

  if (htmlToo) {
    const htmlfilter = { metadataId: { $in: _.map(metadata, 'id') } };
    const htmls = await mongo3.read(
      mongoc,
      nconf.get('schema').htmls,
      htmlfilter,
      { savingTime: -1 }
    );
    ret.html = htmls;
  }

  await mongoc.close();
  return ret;
}

async function getHTMLVideosByMetadataId(metadataId): Promise<ParsedInfo[]> {
  const mongoc = await mongo3.clientConnect();
  const htmls = await mongo3.read(
    mongoc,
    nconf.get('schema').htmls,
    { metadataId },
    { savingTime: -1 }
  );
  await mongoc.close();
  return htmls;
}

async function deleteEntry(publicKey, id): Promise<{ metadata: DeleteResult }> {
  const mongoc = await mongo3.clientConnect();
  const supporter = await mongo3.readOne(
    mongoc,
    nconf.get('schema').supporters,
    { publicKey }
  );
  if (!supporter) throw new Error('publicKey do not match any user');

  const metadata = await mongo3.deleteMany(
    mongoc,
    nconf.get('schema').metadata,
    { id }
  );
  await mongoc.close();
  return { metadata };
}

async function getRelatedByVideoId(videoId, options): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const related = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, [
    { $match: { videoId } },
    { $sort: { savingTime: -1 } },
    { $skip: options.skip },
    { $limit: options.amount },
    // { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
    // TODO verify how this work between v1 and v2 transition
    { $unwind: '$related' },
    { $sort: { savingTime: -1 } },
  ]);
  await mongoc.close();
  debug('Aggregate of getRelatedByVideoId: %d entries', _.size(related));
  return _.map(related, function (r) {
    return {
      savingTime: r.savingTime,
      id: r.id.substr(0, 20),
      watcher: utils.string2Food(r.publicKey),
      blang: r.blang,

      recommendedVideoId: r.related.videoId,
      recommendedPubtime: r.related.publicationTime
        ? r.related.publicationTime.toISOString()
        : 'Invalid Date',
      recommendedForYou: r.related.foryou,
      recommendedTitle: r.related.recommendedTitle,
      recommendedAuthor: r.related.recommendedSource,
      recommendedVerified: r.related.verified,
      recommendationOrder: r.related.index,
      recommendedViews: r.related.recommendedViews,
      watchedId: r.videoId,
      watchedAuthor: r.authorName,
      watchedPubtime: r.publicationTime
        ? r.publicationTime.toISOString()
        : 'Invalid Date',
      watchedTitle: r.title,
      watchedViews: r.viewInfo.viewStr ? r.viewInfo.viewNumber : null,
      watchedChannel: r.authorSource,
    };
  });
}

async function write(where, what): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  let retv;
  try {
    await mongo3.insertMany(mongoc, where, what);
    retv = { error: false, ok: _.size(what) };
  } catch (error) {
    debug('db.write %s', error.message);
    retv = { error: true, info: error.message };
  }
  await mongoc.close();
  return retv;
}

async function tofu(publicKey, version): Promise<any> {
  const mongoc = await mongo3.clientConnect();

  let supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, {
    publicKey,
  });

  if (_.get(supporter, '_id')) {
    supporter.lastActivity = new Date();
    supporter.version = version;
    await mongo3.updateOne(
      mongoc,
      nconf.get('schema').supporters,
      { publicKey },
      supporter
    );
  } else {
    supporter = {};
    supporter.publicKey = publicKey;
    supporter.version = version;
    supporter.creationTime = new Date();
    supporter.lastActivity = new Date();
    supporter.p = utils.string2Food(publicKey);
    debug('TOFU: new publicKey received, from: %s', supporter.p);
    await mongo3.writeOne(mongoc, nconf.get('schema').supporters, supporter);
  }

  await mongoc.close();
  return supporter;
}

async function getLastLeaves(filter, skip, amount): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const labels = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').leaves,
    filter,
    { savingTime: 1 },
    amount,
    skip || 0
  );
  await mongoc.close();

  return {
    overflow: _.size(labels) === amount,
    content: labels,
  };
}

async function upsertSearchResults(listof, cName): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  let written = 0;
  for (const entry of listof) {
    await mongo3.upsertOne(mongoc, cName, { id: entry.id }, entry);
    // TODO check return value to see if updated|upsert|fail
    written++;
  }
  await mongoc.close();
  return written;
}

async function updateAdvertisingAndMetadata(adlist): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  let written = 0;
  for (const entry of adlist) {
    await mongo3.upsertOne(
      mongoc,
      nconf.get('schema').ads,
      { id: entry.id },
      entry
    );
    // TODO check return value to see if updated|upsert|fail
    written++;
  }
  await mongoc.close();
  return written;
}

async function getLastHTMLs(filter, skip, amount): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const defskip = skip || 0;
  const htmls = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').htmls,
    filter,
    { savingTime: 1 }, // never change this!
    amount,
    defskip
  );

  await mongoc.close();
  return {
    overflow: _.size(htmls) === amount,
    content: htmls,
  };
}

async function markHTMLsUnprocessable(htmls): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const ids = _.map(htmls, 'id');
  const r = await mongo3.updateMany(
    mongoc,
    nconf.get('schema').htmls,
    { id: { $in: ids } },
    { processed: false }
  );
  // TODO check return value to check if updated or inserted
  // debug("partial update happened! (it should be ok) %j", r.result);
  await mongoc.close();
  return r;
}

async function createMetadataEntry(mongoc, html, newsection): Promise<any> {
  let exists: any = _.pick(html, [
    'publicKey',
    'savingTime',
    'clientTime',
    'href',
  ]);
  exists = _.extend(exists, newsection);
  exists.id = html.metadataId;
  await mongo3.writeOne(mongoc, nconf.get('schema').metadata, exists);
  return exists;
}

async function updateMetadata(
  html: HTML,
  newsection: any,
  repeat: boolean
): Promise<void> {
  async function markHTMLandClose(
    mongoc: MongoClient,
    html: HTML,
    retval: any
  ): Promise<void> {
    await mongo3.updateOne(
      mongoc,
      nconf.get('schema').htmls,
      { id: html.id },
      { processed: true }
    );
    await mongoc.close();
    return retval;
  }

  /* we should look at the same metadataId in the metadata collection,
       and update new information if missing */
  const mongoc = await mongo3.clientConnect();

  if (!html.metadataId) {
    debug('metadataId is not an ID!');
    return await markHTMLandClose(mongoc, html, { what: 'not an ID' });
  }

  const exists = await mongo3.readOne(mongoc, nconf.get('schema').metadata, {
    id: html.metadataId,
  });

  if (!exists) {
    await createMetadataEntry(mongoc, html, newsection);
    debug(
      'Created metadata %s [%o] — %s',
      html.metadataId,
      html.nature,
      html.href
    );
    return await markHTMLandClose(mongoc, html, { what: 'created' });
  }

  let updates = 0;
  let forceu = repeat;
  const newkeys: string[] = [];
  const updatedkeys: string[] = [];
  /* we don't care if these fields change value, they'll not be 'update' */
  const careless = ['clientTime', 'savingTime'];
  const up = _.reduce(
    newsection,
    function (memo, value, key) {
      if (_.isUndefined(value)) {
        debug('updateChecker: <%s> has undefined value!', key);
        return memo;
      }
      if (_.indexOf(careless, key) !== -1) return memo;

      const current = _.get(memo, key);
      if (!current) {
        _.set(memo, key, value);
        newkeys.push(key);
        updates++;
      } else if (utils.judgeIncrement(key, current, value)) {
        _.set(memo, key, value);
        updatedkeys.push(key);
        forceu = true;
        updates++;
      }
      return memo;
    },
    exists
  );

  if (updates)
    debug(
      'Metadata UPDATE: %s (%o) %d -> new %j, overwritten: %j',
      html.metadataId,
      html.nature,
      updates,
      newkeys,
      updatedkeys
    );

  if (forceu || updates) {
    // debug("Update from incremental %d to %d", exists.incremental, up.incremental);
    // not in youtube!
    await mongo3.updateOne(
      mongoc,
      nconf.get('schema').metadata,
      { id: html.metadataId },
      up
    );
    return await markHTMLandClose(mongoc, html, { what: 'updated' });
  }
  return await markHTMLandClose(mongoc, html, { what: 'duplicated' });
}

async function getMixedDataSince(schema, since, maxAmount): Promise<any> {
  // This is used in admin/monitor with password protected access

  const mongoc = await mongo3.clientConnect();
  const retContent: any[] = [];

  for (const cinfo of schema) {
    const columnName: any = _.first(cinfo);
    const fields: any = _.nth(cinfo, 1);
    const timevar: any = _.last(cinfo);
    const filter: any = _.set({}, timevar, { $gt: since });

    /* it prefer the last samples, that's wgy the sort -1 */
    const r = await mongo3.readLimit(
      mongoc,
      nconf.get('schema')[columnName],
      filter,
      _.set({}, timevar, -1),
      maxAmount,
      0
    );

    /* if an overflow is spotted, with message is appended */
    if (_.size(r) === maxAmount)
      retContent.push({
        template: 'info',
        message: 'Whoa, too many! capped limit at ' + maxAmount,
        subject: columnName,
        id: 'info-' + _.random(0, 0xffff),
        timevar: new Date(
          moment(_.last(r)[timevar]).subtract(1, 'ms').toISOString()
        ),
        /* one second is added to be sure the alarm message appears after the
         * last, and not in between the HTMLs/metadatas */
      });

    /* every object has a variable named 'timevar', and the $timevar we
     * used to pick the most recent 200 is renamed as 'timevar'. This allow
     * us to sort properly the sequence of events happen server side */
    _.each(r, function (o) {
      const good: any = _.pick(o, fields);
      good.template = columnName;
      good.relative = differenceInSeconds(o[timevar], new Date());

      good.timevar = new Date(o[timevar]);
      good.printable = moment(good.timevar).format('HH:mm:ss');
      _.unset(good, timevar);

      /* supporters, or who know in the future, might have not an 'id'.
               it is mandatory for client side logic, so it is attributed random */
      if (_.isUndefined(good.id))
        _.set(good, 'id', 'RANDOM-' + _.random(0, 0xffff));

      retContent.push(good);
    });
  }

  await mongoc.close();
  return retContent;
}

async function flexibleRemove(collection, filter): Promise<boolean> {
  const mongoc = await mongo3.clientConnect();
  const count = await mongo3.count(mongoc, collection, filter);
  if (count === 1) {
    const result = await mongo3.deleteMany(mongoc, collection, filter);
    debug('flexibleRemove result: %j', result.deletedCount);
    return !!result.deletedCount;
  } else {
    debug('flexibleRemove refuse to delete as matches are %d', count);
  }
  await mongoc.close();
  return false;
}

async function getTransformedMetadata(chain): Promise<any> {
  const mongoc = await mongo3.clientConnect();
  const result = await mongo3.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    chain
  );
  await mongoc.close();
  return result;
}

async function markExperCompleted(mongoc, filter): Promise<any> {
  /* this is called in two different condition:
     1) when a new experiment gets registered and the previously 
        opened by the same publicKey should be closed
     2) when the DELETE api is called to effectively close the exp */
  return await mongo3.updateOne(
    mongoc,
    nconf.get('schema').experiments,
    filter,
    {
      status: 'completed',
      completeAt: new Date(),
    }
  );
}

async function concludeExperiment(testTime: Date): Promise<any> {
  /* this function is called by guardoni v.1.8 when the
   * access on a step URL have been completed */
  const mongoc = await mongo3.clientConnect();
  const r = await markExperCompleted(mongoc, { testTime });
  await mongoc.close();
  return r;
}

async function saveExperiment(
  publicKey: string,
  expobj: Experiment
): Promise<Experiment | null> {
  /* this is used by guardoni v.1.8 as handshake connection,
       the expobj constains a variety of fields, check
       routes/experiment.js function channel3 */
  if (expobj.experimentId === 'DEFAULT_UNSET') return null;

  const mongoc = await mongo3.clientConnect();
  /* a given public Key can have only one experiment per time */
  const filter = {
    publicKey,
    status: 'active',
  };

  /* every existing experiment from the same pubkey, which
   * is active, should also be marked "completed" */
  await markExperCompleted(mongoc, filter);

  expobj.status = 'active';
  await mongo3.writeOne(mongoc, nconf.get('schema').experiments, expobj);
  await mongoc.close();
  return expobj;
}

async function pullExperimentInfo(publicKey: string): Promise<Experiment> {
  // because only one experiment per publicKey might
  // exist in a due time, we can be quite sure on the results
  // here
  const mongoc = await mongo3.clientConnect();
  const exp = await mongo3.aggregate(mongoc, nconf.get('schema').experiments, [
    { $match: { publicKey, status: 'active' } },
    {
      $lookup: {
        from: 'directives',
        localField: 'experimentId',
        foreignField: 'experimentId',
        as: 'directive',
      },
    },
  ]);
  await mongoc.close();
  return _.first(exp) ?? null;
}

async function registerSteps(steps: Step[]): Promise<any> {
  /* this API is called by guardoni when --csv is used,
       the API is POST localhost:9000/api/v2/directives */

  const experimentId = utils.hash({
    steps,
  });
  const mongoc = await mongo3.clientConnect();
  const exist = await mongo3.readOne(mongoc, nconf.get('schema').experiments, {
    experimentId,
  });

  if (exist?.experimentId) {
    debug(
      'Experiment (experimentId %s) already found in the DB!',
      experimentId
    );
    await mongoc.close();
    return {
      status: 'exist',
      experimentId: exist.experimentId,
      since: exist.when,
      steps: exist.steps,
    };
  }

  /* else, we don't had such data, hence */
  await mongo3.writeOne(mongoc, nconf.get('schema').experiments, {
    when: new Date(),
    steps,
    experimentId,
  });
  await mongoc.close();
  debug('Registered directive %s', experimentId);
  return { status: 'created', experimentId, since: new Date(), steps };
}

async function pickDirective(
  experimentId: string
): Promise<GetDirectiveOutput['0']> {
  const mongoc = await mongo3.clientConnect();
  const rb = await mongo3.readOne(mongoc, nconf.get('schema').experiments, {
    experimentId,
  });
  await mongoc.close();
  return rb;
}

export default {
  /* used by routes/personal */
  getSummaryByPublicKey,
  getMetadataByPublicKey,
  getVideosByPublicKey,
  deleteEntry,
  getSupporterByPublicKey,

  /* used by routes/public */
  getMetadataByFilter,
  getMetadataFromAuthor,
  getMetadataFromAuthorChannelId,

  /* used by routes/htmlunit */
  getHTMLVideosByMetadataId,

  /* used by public/videoCSV */
  getRelatedByVideoId,

  /* used in events.js processInput */
  tofu,
  write,

  /* used in parserv2 */
  getLastHTMLs,
  updateMetadata,
  markHTMLsUnprocessable,

  /* used in bin/leaveserv.js */
  getLastLeaves,
  upsertSearchResults,
  updateAdvertisingAndMetadata,

  /* used in getMonitor */
  getMixedDataSince,
  flexibleRemove,

  /* generalized aggregation call */
  getTransformedMetadata,

  /* experiment related operations */
  saveExperiment,
  pullExperimentInfo,

  concludeExperiment,

  /* chiaroscuro */
  registerSteps,
  pickDirective,
};
