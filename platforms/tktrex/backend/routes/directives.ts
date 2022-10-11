import D from 'debug';
import nconf from 'nconf';
import * as experlib from '../lib/experiments';
import * as mongo3 from '@shared/providers/mongo.provider';
import * as express from 'express';

const debug = D('routes:directives');

async function post(req: express.Request): Promise<any> {
  const steps = req.body;

  if (!Array.isArray(steps)) {
    return {
      json: {
        error: true,
        status: 400,
        message: "Can't register an experiment with no steps",
      },
    };
  }

  const feedback = await experlib.registerSteps(steps);
  // this feedback is printed at terminal when --csv is used
  return { json: feedback };
}

async function get(req: express.Request): Promise<any> {
  const experimentId = req.params.experimentId;
  debug('requested steps for experiment %s', experimentId);
  const expinfo = await experlib.pickDirective(experimentId);

  if (!expinfo) {
    debug(`Experiment ${experimentId} not found`);
    return {
      json: { error: true, message: 'Not found: experimentId not configured' },
    };
  }

  const { steps } = expinfo;

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

async function getPublic(req: express.Request): Promise<any> {
  // everything would be public until we don't implement the visibility logic,
  // which is not a problem of this API, but a registration default
  // plus an admin-only API to switch visibility.

  const mongoc: any = await mongo3.clientConnect();
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

export { post, get, getPublic };
