#!/usr/bin/env ts-node
/* eslint-disable camelcase */
import dotenv from 'dotenv';
import nconf from 'nconf';
import { cleanTestDB } from '../../../../packages/shared/src/backend/scripts/clean-test-db';
import { trexLogger } from '../../../../packages/shared/src/logger';

dotenv.config({ path: '.env.development' });

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const run = async (): Promise<void> => {
  // ensure we're deleting data from the test db

  await cleanTestDB(trexLogger.extend('yt'), 'yttrex-test', [
    nconf.get('schema').metadata,
    nconf.get('schema').ads,
    nconf.get('schema').htmls,
    nconf.get('schema').leaves,
    nconf.get('schema').experiments,
    nconf.get('schema').supporters,
  ]);
};

void run();
