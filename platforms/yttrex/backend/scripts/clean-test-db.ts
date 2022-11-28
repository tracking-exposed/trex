#!/usr/bin/env ts-node
/* eslint-disable camelcase */

import D from 'debug';
import dotenv from 'dotenv';
import nconf from 'nconf';
import * as mongo from '../../../../packages/shared/src/providers/mongo.provider';

dotenv.config({ path: '.env.development' });

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('yt:backend:clean-test-db');

const run = async (): Promise<void> => {
  // ensure we're deleting data from the test db
  nconf.set('mongoDb', 'yttrex-test');

  const mongoC = await mongo.clientConnect();

  logger('Cleaning all metadata...');
  await mongo.deleteMany(mongoC, nconf.get('schema').metadata, {
    id: { $exists: true },
  });

  logger('Cleaning all ads...');
  await mongo.deleteMany(mongoC, nconf.get('schema').ads, {
    id: { $exists: true },
  });

  logger('Cleaning all htmls...');
  await mongo.deleteMany(mongoC, nconf.get('schema').htmls, {
    id: { $exists: true },
  });

  logger('Cleaning all leaves...');
  await mongo.deleteMany(mongoC, nconf.get('schema').leaves, {
    id: { $exists: true },
  });

  logger('Cleaning all experiments...');
  await mongo.deleteMany(mongoC, nconf.get('schema').experiments, {
    id: { $exists: true },
  });

  logger('Cleaning all supporters...');
  await mongo.deleteMany(mongoC, nconf.get('schema').supporters, {
    id: { $exists: true },
  });

  await mongoC.close();
};

void run();
