#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import nconf from 'nconf';
import { cleanTestDB } from '../../../../packages/shared/src/backend/scripts/clean-test-db';
import { trexLogger } from '../../../../packages/shared/src/logger';

dotenv.config({ path: '.env.development' });

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

const run = async (): Promise<void> => {
  await cleanTestDB(trexLogger.extend('tk'), 'tktrex-test', [
    nconf.get('schema').metadata,
    nconf.get('schema').htmls,
    nconf.get('schema').experiments,
    nconf.get('schema').supporters,
    nconf.get('schema').apiRequests,
    nconf.get('schema').sigiStates,
  ]);
};

void run();
