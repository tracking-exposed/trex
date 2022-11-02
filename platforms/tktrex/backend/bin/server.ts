#!/usr/bin/env node

import moduleAlias from 'module-alias';
moduleAlias({ base: process.cwd() });

/* eslint-disable import/first */
import { Server } from 'http';
import nconf from 'nconf';
import dbUtils from '../lib/dbutils';
import security from '../lib/security';
import { makeApp, appLogger } from './app';
import * as mongo3 from '@shared/providers/mongo.provider';

const cfgFile = 'config/settings.json';
nconf.argv().env().file({ file: cfgFile });

// eslint-disable-next-line
console.log('ઉ nconf loaded, using ', cfgFile);

if (!nconf.get('interface') || !nconf.get('port'))
  throw new Error(
    "check your config/settings.json, config of 'interface' and 'post' missing"
  );

async function initialSanityChecks(): Promise<void> {
  /* security checks = is the password set and is not the default? (more checks might come) */
  security.checkKeyIsSet();
  await dbUtils.checkMongoWorks(true /* if true means that failure is fatal */);
  appLogger.info('tiktok.tracking.exposed backend is operative!');
}

async function start(): Promise<void> {
  const mongo = await mongo3.clientConnect();

  const port = nconf.get('port');
  const host = nconf.get('interface');
  const url = `http://${host}:${port}`;
  const app = await makeApp({ config: nconf.get(), mongo: mongo as any });
  const server = new Server(app);
  /* everything starts here, welcome */
  server.listen(port, host);
  // eslint-disable-next-line
  console.log(`Listening on ${url}`);
  // eslint-disable-next-line
  console.log(`Check server status at ${url}/api/v0/health`);

  initialSanityChecks();
}

void start();
