#!/usr/bin/env ts-node
/* eslint-disable camelcase */

import D from 'debug';
import dotenv from 'dotenv';
import nconf from 'nconf';
import * as mongo from '../../../../packages/shared/src/providers/mongo.provider';

dotenv.config({ path: '.env.development' });

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const logger = D('tk:clean-test-db');

const run = async (): Promise<void> => {
  // ensure we're deleting data from the test db
  nconf.set('mongoDb', 'tktrex-test');
  const mongoC = await mongo.clientConnect();

  logger('Cleaning all metadata...');
  await mongo.deleteMany(mongoC, nconf.get('schema').metadata, {
    id: { $exists: true },
  });

  logger('Cleaning all htmls...');
  await mongo.deleteMany(mongoC, nconf.get('schema').htmls, {
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

  /**
   * Upcoming new collections for 2.8
   */
  // logger('Cleaning all apiRequests...');
  // await mongo.deleteMany(mongoC, nconf.get('schema').apiRequests, {
  //   id: { $exists: true },
  // });

  // logger('Cleaning all sigiStates...');
  // await mongo.deleteMany(mongoC, nconf.get('schema').sigiStates, {
  //   id: { $exists: true },
  // });

  await mongoC.close();
};

void run();
