#!/usr/bin/env node

/* eslint-disable import/first */

import moduleAlias from 'module-alias';
moduleAlias({ base: process.cwd() });
import dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_CONFIG_FILE ?? '.env' });

import { trexLogger } from '@shared/logger';
import * as mongo3 from '@shared/providers/mongo.provider';
import debug from 'debug';
import nconf from 'nconf';

const d = trexLogger.extend('reset-htmls-processed');

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

d.debug('ઉ nconf loaded, using %s', cfgFile);

/* everything begins here, welcome */
const run = async (): Promise<string> => {
  debug.enable(process.env.BACKEND_DEBUG ?? process.env.DEBUG ?? '');
  const mongo = await mongo3.clientConnect();

  if (!mongo) {
    throw new Error('mongo3.clientConnect failed');
  }

  const r = await mongo3.updateMany(
    mongo,
    nconf.get('schema').htmls,
    { processed: true },
    { processed: false, savingTime: new Date() }
  );
  d.info(`Completed %O`, r);
  await mongo.close();
  return `Modified elements ${r.modifiedCount}`;
};

// eslint-disable-next-line
void run().then(console.log, console.error);
