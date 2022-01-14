#!/usr/bin/env node
import express from 'express';
import { Server } from 'http';
import _ from 'lodash';
import nconf from 'nconf';
import createDebug from 'debug';

import dbUtils from '../lib/dbutils';
import security from '../lib/security';

const debug = createDebug('tktrex');

import makeApp from './app';

const main = async () => {
  const cfgFile = "config/settings.json";
  nconf.argv().env().file({ file: cfgFile });

  const app = await makeApp({ debug });
  const server = new Server(app);

  console.log("ઉ nconf loaded, using ", cfgFile);

  if(!nconf.get('interface') || !nconf.get('port') )
      throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");



  /* everything starts here, welcome */
  server.listen(nconf.get('port'), nconf.get('interface'));
  console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));


  async function initialSanityChecks() {
      /* security checks = is the password set and is not the default? (more checks might come) */
      security.checkKeyIsSet();
      await dbUtils.checkMongoWorks(true /* if true means that failure is fatal */);
      debug("tiktok.tracking.exposed backend is operative!")
  }

  initialSanityChecks();
};

main();
