import _ from 'lodash';
import moment from 'moment';
import D from 'debug';
import automo from '../lib/automo';
import params from '../lib/params';
import CSV from '../lib/CSV';
const debug = D('routes:personal');

const CSV_MAX_SIZE = 9000;

async function getPersonal(req): Promise<any> {
  const DEFMAX = 100;
  const k = req.params.publicKey;
  if (_.size(k) < 16)
    return { json: { message: 'Invalid publicKey', error: true } };

  const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
  debug('getPersonal: amount %d skip %d, default max %d', amount, skip, DEFMAX);

  let data: any = null;
  try {
    data = await automo.getSummaryByPublicKey(k, { amount, skip });
    const d = moment.duration(
      (moment(data.supporter.lastActivity) as any) -
        (moment(data.supporter.creationTime) as any)
    );
    data.supporter.hereSince = d.humanize();
    debug(
      'Returning %d videos of %d from a profile hereSince %s, search %d',
      _.size(data.recent),
      data.total,
      data.supporter.hereSince,
      _.size(data.searches)
    );
  } catch (error) {
    debug('Catch exception in getSummaryByPublicKey: %s', error.message);
    return { json: { message: error.message, error: true } };
  }

  /* data should contain '.graphs', '.total', '.supporter', '.recent' */
  if (data.error) return { json: { message: data.message, error: true } };

  data.request = {
    amount,
    skip,
    when: moment().toISOString(),
  };
  return { json: data };
}

async function getPersonalCSV(req): Promise<any> {
  /* this function might return a CSV containing all the video in the homepages,
   * or all the related video. depends on the parameter */
  const CSV_MAX_SIZE = 1000;
  const k = req.params.publicKey;
  const type = req.params.type;

  const supportedATM = ['home', 'video', 'search'];
  if (!supportedATM.includes(type))
    return { text: 'Error 🤷 Invalid request, supported only ' + supportedATM };

  const data = await automo.getMetadataByPublicKey(k, {
    amount: CSV_MAX_SIZE,
    skip: 0,
    type,
  });
  /* this return of videos or homepage, they generated slightly different CSV formats */

  const ready = CSV.unrollNested(data.metadata, {
    type,
    private: true /* might also be 'false' but ... */,
  });

  debug(
    'CSV: Data were %d now unrolling each evidence %d',
    data.metadata.length,
    _.size(ready)
  );
  const csv = CSV.produceCSVv1(ready);
  debug(
    'CSV produced %d bytes, with CSV_MAX_SIZE %d',
    _.size(csv),
    CSV_MAX_SIZE
  );

  if (!_.size(csv))
    return { text: 'Error 🤷 No content produced in this CSV!' };

  const filename =
    'personal-' +
    type +
    '-yttrex-' +
    moment().format('YYYY-MM-DD') +
    '-#' +
    data.metadata.length +
    '.csv';
  return {
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
    text: csv,
  };
}

async function getPersonalTimeline(req): Promise<any> {
  throw new Error('not used anymore');
  // const DEFMAX = 300;
  // const k =  req.params.publicKey;
  // if(_.size(k) < 26)
  //     return { json: { "message": "Invalid publicKey", "error": true }};

  // const { amount, skip } = params.optionParsing(req.params.paging, DEFMAX);
  // debug("getPersonalTimelines request by %s using %d starting videos, skip %d (defmax %d)", k, amount, skip, DEFMAX);
  // const c = await automo.getMetadataByPublicKey(k, {
  //     takefull: true,
  //     amount, skip,
  //     timefilter: moment().subtract(2, 'months').format("YYYY-MM-DD")
  // });

  // const list = _.map(c.metadata, function(e) {
  //     /* console.log( e.value, _.keys(_.pick(e, ['ad', 'title', 'authorName'])),
  //         _.pick(e, ['ad', 'title', 'authorName']) ); */
  //     e.value = utils.hash(e, _.keys(_.pick(e, ['ad', 'title', 'authorName'])));
  //     e.dayString = moment(e.savingTime).format("YYYY-MM-DD");
  //     e.numb = _.parseInt(_.replace(e.value, '/(c+)/', ''));
  //     return e;
  // });
  // debug("getPersonalTimelines transforming %d last %s ", _.size(list),
  //     ( _.first(list) ? _.first(list).title : "[nothing]" )  );

  // const grouped = _.groupBy(list, 'dayString');
  // const aggregated = _.map(grouped, function(perDayEvs, dayStr) {

  //     const videos = _.filter(perDayEvs, { 'type': 'video' });
  //     const homepages = _.filter(perDayEvs, { 'type': 'home' });

  //     const totalsuggested = _.sum(_.map(homepages, function(h) { return _.size(h.selected); }))
  //     const typeUndef = _.sum(_.map(_.countBy(perDayEvs, 'type'), function(amount, name) { return amount; }));
  //     const types = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'type'), ['undefined']), function(amount, name) { return amount; }));
  //     const authors = _.sum(_.map(_.countBy(videos, 'authorName'), function(amount, name) { return amount; }));
  //     // let adverts = _.sum(_.map(_.omit(_.countBy(perDayEvs, 'advertiser'), ['undefined']), function(amount, name) { return amount; }));
  //     /* debug("%s <Vid %d Home %d> -> %j %d - %j %d", dayStr,
  //         _.size(videos), _.size(homepages),
  //         _.countBy(perDayEvs, 'type'), types,
  //         _.countBy(videos, 'authorName'), authors,
  //     ); */
  //     return {
  //         titles: _.map(videos, 'title'),
  //         homepages,
  //         types,
  //         typeUndef,
  //         totalsuggested,
  //         authors,
  //         type: _.countBy(perDayEvs, 'type'),
  //         authorName: _.countBy(videos, 'authorName'),
  //         dayStr,
  //     }
  // });
  // const oneWeekAgoDateString = moment().subtract(1, 'week').format("YYYY-MM-DD");
  // return {
  //     json: { aggregated, oneWeekAgoDateString }
  // };
}

async function getPersonalRelated(req): Promise<any> {
  const METADATAMAXCONSIDERED = 40;
  const k = req.params.publicKey;
  const type = req.params.type;

  if (!CSV.allowedTypes.includes(type))
    return { status: 401, text: 'Invalid type: allowed ' + CSV.allowedTypes };

  const { amount, skip } = params.optionParsing(
    req.params.paging,
    METADATAMAXCONSIDERED
  );
  debug(
    'getPersonalRelated request by %s using %d starting videos, skip %d (defmax %d)',
    k,
    amount,
    skip,
    METADATAMAXCONSIDERED
  );
  const { metadata } = await automo.getMetadataByPublicKey(k, {
    amount,
    skip,
    type,
  });
  debug('arrive %d', metadata.length);
  const formatted = CSV.unrollNested(metadata, {
    type,
    experiment: true,
  });
  debug('getPersonalRelated produced %d results', formatted.length);
  return {
    json: formatted,
  };
}

const getPersonalByExperimentId = async (
  req
): Promise<{ json: any } | { headers: any; text: string }> => {
  const experimentId = req.params.experimentId;
  const publicKey = req.params.publicKey;
  const format = req.params.format;

  const supporter = await automo.getSupporterByPublicKey(publicKey);

  const opts = { amount: 100, skip: 0 };
  const htmls = await automo.getLastHTMLs(
    {
      publicKey: {
        $eq: publicKey,
      },
      experimentId: {
        $eq: experimentId,
      },
    },
    opts.skip,
    opts.amount
  );

  const htmlIds = htmls.content.map((h) => h.metadataId);

  // debug('Html ids %O', htmlIds);

  const { data: metadata } = await automo.getMetadataByFilter(
    {
      id: {
        $in: htmlIds,
      },
      publicKey: {
        $eq: publicKey,
      },
    },
    opts
  );

  if (format === 'csv') {
    const csv = CSV.produceCSVv1(metadata);

    debug('getPersonalCSV (%d)', metadata.length, csv.length, CSV_MAX_SIZE);

    const filename =
      'tk-' + experimentId + '-' + moment().format('YY-MM-DD') + '.csv';

    return {
      headers: {
        'Content-Type': 'csv/text',
        'Content-Disposition': 'attachment; filename=' + filename,
      },
      text: csv,
    };
  }

  return {
    json: {
      supporter,
      metadata,
    },
  };
};

async function getEvidences(req): Promise<any> {
  /* this function is quite generic and flexible. allow an user to query their
   * own evidences and allow specification of which is the field to be queried.
   * It is used in our interface with 'id' */
  const k = req.params.publicKey;
  if (_.size(k) < 26)
    return { json: { message: 'Invalid publicKey', error: true } };

  const allowFields = ['id', 'metadataId', 'savingTime'];
  const targetKey = req.params.key;
  const targetValue = req.params.value;

  // TODO savingTime is not really supported|tested
  if (!allowFields.includes(targetKey))
    return {
      json: {
        message: `Key ${targetKey} not allowed (${allowFields})`,
        error: true,
      },
    };

  const matches = await automo.getVideosByPublicKey(
    k,
    _.set({}, targetKey, targetValue),
    false
  );
  /* if last param is 'true' would return html too */

  debug(
    'getEvidences with flexible filter found %d matches',
    _.size(matches.metadata)
  );
  return { json: matches.metadata };
}

async function removeEvidence(req): Promise<any> {
  const k = req.params.publicKey;
  if (_.size(k) < 26)
    return { json: { message: 'Invalid publicKey', error: true } };

  const id = req.params.id;
  const result = await automo.deleteEntry(k, id);
  return { json: { success: true, result } };
}

module.exports = {
  getPersonal,
  getPersonalCSV,
  getPersonalTimeline,
  getPersonalRelated,
  getPersonalByExperimentId,
  getEvidences,
  removeEvidence,
};
