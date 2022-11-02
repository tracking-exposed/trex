import * as mongo3 from '@shared/providers/mongo.provider';
import D from 'debug';
import * as express from 'express';
import _ from 'lodash';
import moment from 'moment';
import nconf from 'nconf';
import CSV from '../lib/CSV';
import * as experlib from '../lib/experiments';
import * as params from '../lib/params';
import { TKMetadataDB } from '../models/metadata';

const debug = D('routes:experiments');

async function sharedDataPull(filter: any): Promise<any> {
  /* this function is invoked by the various API below */
  const MAX = 3000;
  const mongoc: any = await mongo3.clientConnect();
  const metadata = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').metadata,
    filter,
    { savingTime: -1 },
    MAX,
    0
  );
  await mongoc.close();

  debug(
    'Found %d available data by filter %o (max %d) %j',
    metadata.length,
    filter,
    MAX,
    _.countBy(metadata, 'type')
  );
  return metadata;
}

// function dotify(data) {
//     const dot = Object({links: [], nodes: []})
//     dot.links = _.map(data, function(video) {
//         return {
//             target:
//                 video.profile + '—' +
//                 video.expnumber + '—' +
//                 moment(video.savingTime).format("dddd"),
//             source: video.recommendedVideoId,
//             value: 1
//         } });
//     const vList = _.uniq(_.map(data, function(video) { return video.recommendedVideoId }));
//     const videoObject = _.map(vList, function(v) { return { id: v, group: 1 }});
//     const pList = _.uniq(_.map(data, function(video) {
//         return video.profile + '—' +
//                video.expnumber + '—' +
//                moment(video.savingTime).format("dddd")
//     }));
//     const pseudoObject = _.map(pList, function(v) { return { id: v, group: 2 }});
//     dot.nodes = _.concat(videoObject, pseudoObject);
//     return dot;
// }

async function dot(req: express.Request): Promise<any> {
  throw new Error("Remind this can't work because metadata has many type");

  // const experiment = params.getString(req, 'experimentId', true);
  // const metadata = await sharedDataPull(experiment);

  // if(!_.size(related))
  //     return { json: {error: true, message: "No data found with such parameters"}}

  // const grouped = _.groupBy(related, 'videoName');
  // const dotchain = _.map(grouped, function(vidlist, videoName) {
  //     return {
  //         videoName,
  //         dotted: dotify(vidlist)
  //     };
  // })
  // return { json: dotchain };
}

async function json(req: express.Request): Promise<any> {
  const experimentId = params.getString(req, 'experimentId');
  const metadata = await sharedDataPull({
    'experiment.experimentId': experimentId,
  });
  return { json: metadata };
}

async function csv(req: express.Request): Promise<any> {
  const type: any = req.params.type;
  if (!CSV.allowedTypes.includes(type)) {
    debug('Invalid requested data type? %s', type);
    return { text: 'Error, invalid URL composed' };
  }

  const experimentId = params.getString(req, 'experimentId');
  const metadata = await sharedDataPull({
    'experiment.experimentId': experimentId,
    type,
  });

  const transformed = CSV.unrollNested(metadata, {
    type,
    experiment: true,
    private: true,
  });

  const textcsv = CSV.produceCSVv1(transformed);
  debug(
    'Fetch %d metadata(s), and converted in a %d CSV',
    _.size(metadata),
    _.size(textcsv)
  );

  const filename = `${experimentId.substr(0, 8)}-${type}-${
    transformed.length
  }.csv`;
  return {
    text: textcsv,
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
  };
}

async function list(req: express.Request): Promise<any> {
  /* this function pull from the collection "directives"
   * and filter by returning only the 'comparison' kind of
   * experiment. This is imply req.params.type == 'comparison' */
  const MAX = 400;

  const filter = {};
  const mongoc: any = await mongo3.clientConnect();

  const configured = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').experiments,
    filter,
    { when: -1 },
    MAX,
    0
  );

  const active = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').experiments,
    filter,
    { testTime: -1 },
    MAX,
    0
  );

  const expIdList = _.map(configured, 'experimentId');
  const lastweek = await mongo3.readLimit<TKMetadataDB>(
    mongoc,
    nconf.get('schema').metadata,
    {
      'experiment.experimentId': { $in: expIdList },
    },
    { savingTime: -1 },
    MAX,
    0
  );

  await mongoc.close();

  const infos: any = {};
  /* this is the return value, it would contain:
         .configured  (the directive list)
         .active      (eventually non-completed experiments)
         .recent      (activly marked metadata)
     */
  infos.configured = _.map(configured, function (r) {
    r.humanizedWhen = moment(r.when).format('YYYY-MM-DD');
    return _.omit(r, ['_id']);
  });

  infos.active = _.compact(
    _.map(active, function (e) {
      if (e.status === 'completed') return null;
      _.unset(e, '_id');
      e.publicKey = e.publicKey.substr(0, 8);
      return e;
    })
  );

  infos.recent = _.reduce(
    _.groupBy(
      _.map(lastweek, function (e) {
        return {
          publicKey: e.publicKey.substr(0, 8),
          researchTag: e.researchTag,
          experimentId: e.experimentId,
        };
      }),
      'experimentId'
    ),
    function (memo: any, listOf, experimentId) {
      memo[experimentId] = {
        contributions: _.countBy(listOf, 'researchTag'),
        profiles: _.countBy(listOf, 'publicKey'),
      };
      return memo;
    },
    {}
  );

  debug(
    'Directives found: configured %d active %d (type %s, max %d)',
    infos.configured.length,
    infos.active.length,
    MAX
  );

  return {
    json: infos,
  };
}

async function channel3(req: express.Request): Promise<any> {
  // this is invoked as handshake, and might return information
  // helpful for the extension, about the experiment running.

  const fields = [
    'href',
    'experimentId',
    'researchTag',
    'execount',
    'profileName',
  ];
  const experimentInfo = _.pick(req.body, fields);

  experimentInfo.testName = new Date(req.body.when);
  experimentInfo.publicKey = _.get(req.body, 'config.publicKey');

  debug('Experiment info %O', experimentInfo);

  const retval = await experlib.saveExperiment(experimentInfo as any);
  /* this is the default answer, as normally there is not an
   * experiment running */
  if (_.isNull(retval)) return { json: { experimentId: false } };

  debug(
    "Marked experiment as 'active' — %j",
    _.pick(retval, ['researchTag', 'execount'])
  );
  return { json: retval };
}

async function conclude3(req: express.Request): Promise<any> {
  const testTime = req.params.testTime;
  debug('Conclude3 received: %s', testTime);
  if (testTime.length < 10) return { status: 403 };

  const test = moment(testTime);
  if (!test.isValid) return { status: 403 };

  const retval = await experlib.concludeExperiment(testTime);
  // retval is {"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":0}
  return { json: retval };
}

export {
  dot,
  json,
  list,
  csv,

  /* used by the browser extension/guardoni */
  channel3,
  conclude3,
};

