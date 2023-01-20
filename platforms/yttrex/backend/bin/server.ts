#!/usr/bin/env node

/* eslint-disable import/first */

import moduleAlias from 'module-alias';
moduleAlias({ base: process.cwd() });

import * as http from 'http';
import debug from 'debug';
import nconf from 'nconf';
import * as dbutils from '../lib/dbutils';
import security from '../lib/security';
import { makeApp } from './app';
import * as mongo3 from '@shared/providers/mongo.provider';

const d = debug('yttrex');

const cfgFile = 'config/settings.json';

nconf.argv().env().file({ file: cfgFile });

d('ઉ nconf loaded, using %s', cfgFile);

if (!nconf.get('interface') || !nconf.get('port'))
  throw new Error(
    "check your config/settings.json, config of 'interface' and 'post' missing"
  );

/* everything begins here, welcome */
const start = async (): Promise<void> => {
  debug.enable(process.env.BACKEND_DEBUG ?? process.env.DEBUG ?? '');
  const mongo = await mongo3.clientConnect();

  if (!mongo) {
    throw new Error('mongo3.clientConnect failed');
  }

  /* create express app */
  const app = await makeApp({
    config: nconf.get(),
    mongo,
  });
  const port = nconf.get('port');
  const host = nconf.get('interface');
  const url = `http://${host}:${port}`;
  const server = new http.Server(app as any);
  server.listen(port, host, () => {
    d(`Listening on ${url}`);
    d(`Check server status at %s/api/v0/health`, url);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const initialSanityChecks: () => void = async () => {
    /* security checks = is the password set and is not the default? (more checks might come) */
    security.checkKeyIsSet();
    return await dbutils.checkMongoWorks(
      true /* if true means that failure is fatal */
    );
  };

  initialSanityChecks();
};

void start();
