#!/usr/bin/env node
import { Server } from 'http';
import nconf from 'nconf';
import dbUtils from '../lib/dbutils';
import security from '../lib/security';
import { makeApp, appLogger } from './app';
import mongo3 from '../lib/mongo3';

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
  appLogger('tiktok.tracking.exposed backend is operative!');
}

async function start(): Promise<void> {
  const mongo = await mongo3.clientConnect();

  const app = await makeApp({ config: nconf.get(), mongo });
  const server = new Server(app);
  /* everything starts here, welcome */
  server.listen(nconf.get('port'), nconf.get('interface'));
  // eslint-disable-next-line
  console.log(
    ' Listening on http://' + nconf.get('interface') + ':' + nconf.get('port')
  );

  initialSanityChecks();
}

void start();
