/*
 * this library is a mixture between some experiment shared
 * functions used to play with experiment, directives, etc
 */
const nconf = require('nconf');
const debug = require('debug')('lib:experiments');
// const moment = require('moment');

const utils = require('./utils');
const mongo3 = require('./mongo3');

async function pickDirective(experimentId) {
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const rb = await mongo3.readOne(mongoc, nconf.get('schema').experiments, {
    experimentId,
  });
  await mongoc.close();
  return rb;
}

async function registerDirective(directives) {
  debug('Registering directive requested');

  const experimentId = utils.hash({
    directives,
  });
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const exist = await mongo3.readOne(mongoc, nconf.get('schema').experiments, {
    experimentId,
  });

  if (exist && exist.experimentId) {
    debug(
      'Experiment %s duplicated (seen first in %s)',
      experimentId,
      exist.when
    );
    await mongoc.close();
    return {
      status: 'exist',
      experimentId: exist.experimentId,
      since: exist.when,
      links: exist.links,
    };
  }

  /* else, we don't had such data, hence */
  debug('Registering new experiment %s: %j', experimentId, directives);
  await mongo3.writeOne(mongoc, nconf.get('schema').experiments, {
    when: new Date(),
    directives,
    experimentId,
  });

  await mongoc.close();
  debug(
    'Registered experiment %s with %d directives',
    experimentId,
    directives.links
  );
  return { status: 'created', experimentId };
}

async function markExperCompleted(mongoc, filter) {
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

async function concludeExperiment(testTime) {
  /* this function is called by guardoni v.1.8 when the
   * access on a directive URL have been completed */
  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  const r = await markExperCompleted(mongoc, { testTime });
  await mongoc.close();
  return r;
}

async function saveExperiment(expobj) {
  /* this is used by guardoni v.1.8 as handshake connection,
       the expobj constains a variety of fields, check
       routes/experiment.js function channel3 */
  if (expobj.experimentId === 'DEFAULT_UNSET') return null;

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });
  /* a given public Key can have only one experiment per time */
  const filter = {
    publicKey: expobj.publicKey,
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
module.exports = {
  pickDirective,
  registerDirective,
  concludeExperiment,
  saveExperiment,
};
