import automo from '../lib/automo';
const _ = require('lodash');
const debug = require('debug')('routes:directives');

const mongo3 = require('@shared/providers/mongo.provider');
const nconf = require('nconf');

function timeconv(maybestr, defaultMs) {
  if (_.isInteger(maybestr) && maybestr > 100) {
    /* it is already ms */
    return maybestr;
  } else if (_.isInteger(maybestr) && maybestr < 100) {
    /* throw an error as it is unclear if you forgot the unit */
    throw new Error(
      'Did you forget unit? ' + maybestr + ' milliseconds is too little!'
    );
  } else if (_.isString(maybestr) && _.endsWith(maybestr, 's')) {
    return _.parseInt(maybestr) * 1000;
  } else if (_.isString(maybestr) && _.endsWith(maybestr, 'm')) {
    return _.parseInt(maybestr) * 1000 * 60;
  } else if (_.isString(maybestr) && maybestr === 'end') {
    return 'end';
  } else {
    return null;
  }
}

function comparison(videoinfo, counter) {
  return {
    ...videoinfo, // watchTime, urltag, url
    loadFor: 5000,
  };
}

function acquireComparison(parsedCSV) {
  return _.map(parsedCSV, function (o) {
    o.watchFor = timeconv(o.watchFor, 20123);
    return o;
  });
}

async function post(req) {
  const parsedCSV = req.body ?? [];

  let directives = [];
  directives = acquireComparison(parsedCSV);

  debug('Registering directive (%d urls)', _.size(directives));

  if (_.size(directives) === 0) {
    throw new Error("Can't register csv without 'directives'");
  }

  const feedback = await automo.registerSteps(directives);
  // this feedback is printed at terminal when --csv is used
  return { json: feedback };
}

async function get(req) {
  const experimentId = req.params.experimentId;

  debug('GET: should return directives for %s', experimentId);
  const expinfo = await automo.pickDirective(experimentId);

  const steps = _.map(expinfo?.steps ?? [], comparison);
  debug('Comparison %s produced %d', experimentId, steps.length);
  return { json: steps };
}

async function getPublic(req) {
  const mongoc = await mongo3.clientConnect();

  const publicDirectives = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').experiments,
    {},
    { when: -1 },
    20,
    0
  );

  await mongoc.close();

  debug('getPublic experiments returns %d', publicDirectives.length);
  return {
    json: publicDirectives,
  };
}

export {
  comparison,
  post,
  get,
  getPublic,
  timeconv,
};
