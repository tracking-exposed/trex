const debug = require('debug')('routes:directives');
const nconf = require('nconf');
const experlib = require('../lib/experiments');
const mongo3 = require('../lib/mongo3');

async function post(req) {
  const steps = req.body;

  const feedback = await experlib.registerDirective(steps);
  // this feedback is printed at terminal when --csv is used
  return { json: feedback };
}

async function get(req) {
  const experimentId = req.params.experimentId;
  debug('requested steps for experiment %s', experimentId);
  const expinfo = await experlib.pickDirective(experimentId);

  if (!expinfo) {
    debug(`Experiment ${experimentId} not found`);
    return {
      json: { error: true, message: 'Not found: experimentId not configured' },
    };
  }

  const steps = expinfo.directives ?? expinfo.links ?? [];

  if (!steps.length) {
    debug(
      `Experiment ${experimentId} invalid format? has zero links to navigate on`
    );
    return {
      json: {
        error: true,
        message: 'Invalid experiment, no links found',
        details: [expinfo],
      },
    };
  }

  return { json: steps };
}

async function getPublic(req) {
  // everything would be public until we don't implement the visibility logic,
  // which is not a problem of this API, but a registration default
  // plus an admin-only API to switch visibility.

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  // TODO we've to implement paging in this API because it affect
  // Guardoni-UX and, at the moment, we forcefully cap to 20 the max results

  // TODO this API can also be cached with the same logic of statistics
  const publicDirectives = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').experiments,
    {}, // TODO { visibility: 'public' },
    { when: -1 },
    20,
    0
  );

  await mongoc.close();

  return {
    json: publicDirectives,
  };
}

module.exports = {
  post,
  get,
  getPublic,
};
