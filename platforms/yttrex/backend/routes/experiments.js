import automo from '../lib/automo';

const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');
const nconf = require('nconf');
const params = require('../lib/params');
const CSV = require('../lib/CSV');
const mongo3 = require('@shared/providers/mongo.provider');

async function sharedDataPull(filter) {
  // this function is invoked by the various API below,
  // and it might proxy a mongodb query to 'metadata' or to 'ads'

  const mongoc = await mongo3.clientConnect({ concurrency: 5 });
  /* these values are used to fetch max of 3000 metadata */
  const SLOT = 500;
  let keepfe = true;

  if (filter.type === 'adv') {
    // this condition is different from the standard code, so it is handled
    // and resolved in this code branch.
    const ads = await mongo3.aggregate(mongoc, nconf.get('schema').ads, [
      {
        $match: {
          'experiment.experimentId': filter['experiment.experimentId'],
        },
      },
      { $limit: SLOT * 6 },
      { $skip: 0 },
      {
        $lookup: {
          from: 'metadata',
          localField: 'metadataId',
          foreignField: 'id',
          as: 'metadata',
        },
      },
    ]);

    debug(
      'Found %d available advertising matching experimentId %s',
      ads.length,
      filter['experiment.experimentId']
    );
    await mongoc.close();
    return _.map(ads, function (a) {
      // this format is basically fixed to help CSV generation, but works well also as mixed
      return {
        ..._.pick(a, [
          'metadataId',
          'nature',
          'id',
          'savingTime',
          'publicKey',
          'selectorName',
          'sponsoredSite',
          'sponsoredName',
        ]),
        originalHref: a.href,
        experiment: a.experiment,
        ..._.pick(a.metadata[0], ['clientTime', 'login', 'uxLang']),
        type: 'adv',
      };
    });
  }

  // accumulate data with 5 parallel queries and a reduction, it is a design
  // choice because keeping html in memory might lead to OOM
  const metadata = [];
  const match = { $match: filter };
  const sort = { $sort: { savingTime: -1 } };
  const lookup = {
    $lookup: {
      from: 'htmls',
      localField: 'id',
      foreignField: 'metadataId',
      as: 'html',
    },
  };

  for (const counter of [0, 1, 2, 3, 4, 5]) {
    const skipAmount = counter * SLOT;

    if (keepfe) {
      const data = await mongo3.aggregate(
        mongoc,
        nconf.get('schema').metadata,
        [match, sort, { $skip: skipAmount }, { $limit: SLOT }, lookup]
      );
      _.each(data, function (e) {
        e.originalHref = e.html[0].href;
        _.unset(e, 'html');
        metadata.push(e);
      });
      /* if the amount of data is less than SLOT, stop looping */
      if (data.length < SLOT) keepfe = false;
    }
  }
  await mongoc.close();

  debug(
    'Found %d available data by filter %o (slot of %d) %j',
    metadata.length,
    filter,
    SLOT,
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

async function dot(req) {
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

async function json(req) {
  const experimentId = params.getString(req, 'experimentId', true);
  const metadata = await sharedDataPull({
    'experiment.experimentId': experimentId,
  });
  return { json: metadata };
}

async function csv(req) {
  const type = req.params.type;
  if (CSV.allowedTypes.indexOf(type) === -1) {
    debug('Invalid requested data type? %s', type);
    return {
      // video, search, home, adv
      text: `Error, invalid URL — Allowed types: ${CSV.allowedTypes.join(
        ', '
      )}.`,
    };
  }

  const experimentId = params.getString(req, 'experimentId', true);
  const filter = {
    'experiment.experimentId': experimentId,
    type,
  };
  const metadata = await sharedDataPull(filter);

  if (!metadata.length) {
    debug(
      'Zero entry matching this filter, returning a text error! filter %j',
      filter
    );
    return { text: 'zero entries matching this filter!' };
  }

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

  const filename = `experiment-${experimentId.substr(0, 8)}-${type}-${
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

async function list(req) {
  /* this function pull from the collection "directives"
     * and filter by returning only the 'comparison' kind of
     * experiment.

     THIS IS BASICALLY ONLY RETURNING CONFIGURED DIRECTIVES,
     NOT THE RUNNING EXPERIMENTS. THIS FUNCTION MIGHT BE MORE APPROPIATE
     IN routes/directives.js

     */

  /* default query params for Taboule,
       they might be moved in a proper lib function */
  const DEFAULT_AMOUNT = 50;
  const amount = req.query.amount
    ? _.parseInt(req.query.amount)
    : DEFAULT_AMOUNT;
  const skip = req.query.skip ? _.parseInt(req.query.skip) : 0;
  const options = { amount, skip };

  const filter = {};
  const mongoc = await mongo3.clientConnect();

  const configured = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').experiments,
    filter,
    { when: -1 },
    options.amount,
    options.skip
  );
  /*
    const expIdList = _.map(configured, 'experimentId');
    const lastweek = await mongo3
        .readLimit(mongoc, nconf.get('schema').metadata, {
            "experiment.experimentId": { "$in": expIdList }
        }, { savingTime: -1}, options.amount, options.skip);
*/

  const total = await mongo3.count(
    mongoc,
    nconf.get('schema').experiments,
    filter
  );

  await mongoc.close();

  const c = _.map(configured, function (r) {
    r.humanizedWhen = moment(r.when).format('YYYY-MM-DD');
    return _.omit(r, ['_id']);
  });

  /*
    recent = _.reduce(_.groupBy(_.map(lastweek, function(e) {
         return {
             publicKey: e.publicKey.substr(0, 8),
             evidencetag: e.experiment.evidencetag,
             experimentId: e.experiment.experimentId
         }
    }), 'experimentId'), function(memo, listOf, experimentId) {
        memo[experimentId] = {
            contributions: _.countBy(listOf, 'evidencetag'),
            profiles: _.countBy(listOf, 'publicKey')
        };
        return memo;
    }, {});

    debug("Directives found: %d configured %d active %d recent (type %s, max %d)",
        infos.configured.length, infos.active.length,
        infos.recent.length, type, MAX);
*/

  /* result for Taboule need to fit a standard format */
  const taboulefmt = {
    pagination: options,
    content: _.take(c, options.amount),
    total,
  };

  return {
    json: taboulefmt,
  };
}

async function channel3(req) {
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

  experimentInfo.testName = req.body.testTime ?? new Date().toISOString();
  experimentInfo.publicKey = _.get(req.body, 'config.publicKey');

  if (!experimentInfo.experimentId) return { json: { ignored: true } };

  debug('Experiment info %O', experimentInfo);

  const retval = await automo.saveExperiment(experimentInfo);
  /* this is the default answer, as normally there is not an
   * experiment running */
  if (_.isNull(retval)) return { json: { experimentId: false } };

  debug(
    "Marked experiment as 'active' — %j",
    _.pick(retval, ['researchTag', 'execount'])
  );
  return { json: retval };
}

module.exports = {
  /* used by the webapps */
  csv,
  dot,
  json,
  list,

  /* used by the browser extension/guardoni */
  channel3,
};
