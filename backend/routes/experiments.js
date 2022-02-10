const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');
const nconf = require('nconf');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');
const security = require('../lib/security');

async function sharedDataPull(filter) {
  /* this function is invoked by the various API below */
  const MAX = 3000;
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });

  const metadata = await mongo3.aggregate(
    mongoc,
    nconf.get('schema').metadata,
    [
      { $match: filter },
      {
        $lookup: {
          from: 'htmls',
          localField: 'id',
          foreignField: 'metadataId',
          as: 'html',
        },
      },
      { $sort: { savingTime: -1 } },
      { $skip: 0 },
      { $limit: MAX },
    ]
  );
  await mongoc.close();

  debug(
    'Found %d available data by filter %o (max %d) %j',
    metadata.length,
    filter,
    MAX,
    _.countBy(metadata, 'type')
  );
  return _.map(metadata, function (e) {
    e.originalHref = e.html[0].href;
    _.unset(e, 'html');
    return e;
  });
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
      text: 'Error, invalid URL composed. allowed types: ' + CSV.allowedTypes,
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

     * experiments API: "comparison" require password,
                        "chiaroscuro" doesn't                     */
  const type = req.params.directiveType;

  if (['comparison', 'chiaroscuro'].indexOf(type) === -1)
    return { text: 'Directive Type not supported! ' };

  if (type === 'comparison') {
    /* this kind of directive require password for listing,
           instead the shadowban at the moment is free access */
    if (!security.checkPassword(req)) return { status: 403 };
  }

  /* default query params for Taboule,
       they might be moved in a proper lib function */
  const DEFAULT_AMOUNT = 50;
  const amount = req.query.amount
    ? _.parseInt(req.query.amount)
    : DEFAULT_AMOUNT;
  const skip = req.query.skip ? _.parseInt(req.query.skip) : 0;
  const options = { amount, skip };

  const filter = { directiveType: type };
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });

  const configured = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').directives,
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
    nconf.get('schema').directives,
    filter
  );

  await mongoc.close();

  const c = _.map(configured, function (r) {
    r.humanizedWhen = moment(r.when).format('YYYY-MM-DD');
    return _.omit(r, ['_id', 'directiveType']);
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

async function emergency(req) {
  // this 'emergency' app have been written mainly to address an issue
  // in experiment tracking. It would be useful for experiment run between
  // November 2021 and 26 January 2022.
  // https://github.com/tracking-exposed/yttrex/issues/329
  // this api returns CSV
  const MAX = 3000;
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });

  const type = req.params.type;
  if (CSV.allowedTypes.indexOf(type) === -1) {
    debug('Invalid requested data type? %s', type);
    return { text: 'Error, invalid URL composed' };
  }

  // first step is: from the experimentId, pass via 'directives' and
  // retrieve the URLs
  const experimentId = params.getString(req, 'experimentId', true);
  const directive = await mongo3.readOne(
    mongoc,
    nconf.get('schema').directives,
    {
      experimentId,
      directiveType: 'comparison',
    }
  );
  if (!directive) {
    debug(
      "Only 'comparison' directives are allowed in emergency — experimentId not found"
    );
    return { text: 'experimentId not found!? ' + experimentId };
  }

  const urls = _.map(directive.links, 'url');

  const metadata = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').metadata,
    {
      href: { $in: urls },
      type,
    },
    { savingTime: -1 },
    MAX,
    0
  );

  await mongoc.close();

  debug(
    'Emergency call: found %d available with %d urls (max %d) types: %j',
    metadata.length,
    urls.length,
    MAX,
    _.countBy(metadata, 'type')
  );

  const transformed = CSV.unrollNested(metadata, {
    type,
    experiment: false,
    private: false,
  });

  const textcsv = CSV.produceCSVv1(transformed);
  debug(
    'Fetch %d metadata(s), and converted in a %d CSV',
    _.size(metadata),
    _.size(textcsv)
  );

  if (!textcsv.length)
    return { text: 'Error: an empty CSV have been produced' };

  const filename = `eexperiment-${experimentId.substr(0, 8)}-${type}-${
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

async function channel3(req) {
  // this is invoked as handshake, and might return information
  // helpful for the extension, about the experiment running.
  const fields = [
    'href',
    'experimentId',
    'evidencetag',
    'execount',
    'newProfile',
    'profileName',
    'directiveType',
  ];
  const experimentInfo = _.pick(req.body, fields);

  experimentInfo.testName = new Date(req.body.when);
  experimentInfo.publicKey = _.get(req.body, 'config.publicKey');

  const retval = await automo.saveExperiment(experimentInfo);
  /* this is the default answer, as normally there is not an
   * experiment running */
  if (_.isNull(retval)) return { json: { experimentId: false } };

  debug(
    "Marked experiment as 'active' — %j",
    _.pick(retval, ['evidencetag', 'execount', 'directiveType'])
  );
  return { json: retval };
}

async function conclude3(req) {
  const testTime = req.params.testTime;
  debug('Conclude3 received: %s', testTime);
  if (testTime.length < 10) return { status: 403 };

  const test = moment(testTime);
  if (!test.isValid) return { status: 403 };

  const retval = await automo.concludeExperiment(testTime);
  // retval is {"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":0}
  return { json: retval };
}

module.exports = {
  /* used by the webapps */
  csv,
  dot,
  json,
  list,
  emergency,

  /* used by the browser extension/guardoni */
  channel3,
  conclude3,
};
