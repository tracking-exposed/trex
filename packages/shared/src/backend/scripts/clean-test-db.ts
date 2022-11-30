#!/usr/bin/env ts-node
/* eslint-disable camelcase */

import nconf from 'nconf';
import { Logger } from '../../logger';
import * as mongo from '../../providers/mongo.provider';

export const cleanTestDB = async (
  logger: Logger,
  testDB: string,
  collections: string[]
): Promise<void> => {
  const log = logger.extend('clean-test-db');
  // ensure we're deleting data from the test db
  nconf.set('mongoDb', testDB);
  const mongoC = await mongo.clientConnect();

  await Promise.all(
    collections.map(async (c) => {
      log.debug('Cleaning %s...', c);
      await mongo.deleteMany(mongoC, c, {
        id: { $exists: true },
      });
    })
  );

  await mongoC.close();
};
