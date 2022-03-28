#!/usr/bin/env node
import express from 'express';
import { Server } from 'http';
import _ from 'lodash';
import bodyParser from 'body-parser';
import createDebug from 'debug';
import nconf from 'nconf';
import cors from 'cors';

import dbUtils from '../lib/dbutils';
import security from '../lib/security';

import { getCountryFeed } from '../routes/observatory';

const debug = createDebug('tkobs');

const app = express();
const server = new Server(app);
const cfgFile = 'config/observatory.json';

nconf.argv().env().file({ file: cfgFile });

// eslint-disable-next-line
console.log('ઉ nconf loaded, using ', cfgFile);

if (!nconf.get('interface') || !nconf.get('port'))
  throw new Error(
    "check your config/settings.json, config of 'interface' and 'post' missing"
  );

async function iowrapper(funct, req, res): Promise<void> {
  try {
    const httpresult = await funct(req, res);

    if (httpresult.headers)
      _.each(httpresult.headers, function (value, key) {
        debug('Setting header %s: %s', key, value);
        res.setHeader(key, value);
      });

    if (!httpresult) {
      debug("API didn't return anything!?");
      res.send('Fatal error: Invalid output');
      res.status(501);
    } else if (httpresult.json?.error) {
      debug('API failure, returning 500');
      res.status(500);
      res.json(httpresult.json);
    } else if (httpresult.json) {
      debug(
        'API success, returning %d bytes JSON',
        _.size(JSON.stringify(httpresult.json))
      );
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(httpresult.json);
    } else if (httpresult.text) {
      debug('API success, returning text (size %d)', _.size(httpresult.text));
      res.send(httpresult.text);
    } else if (httpresult.status) {
      debug('Returning empty status %d from API', httpresult.status);
      res.status(httpresult.status);
    } else {
      debug('Undetermined failure in API %j', httpresult);
      res.status(502);
      res.send('Error?');
    }
  } catch (error) {
    res.status(505);
    if (error instanceof Error) {
      res.send('Software error: ' + error.message);
      debug('Error in HTTP handler: %s %s', error.message, error.stack);
    } else {
      res.send('Unknown software error.');
      debug('Unknown error in HTTP handler: %s', error);
    }
  }
  res.end();
}

/* everything starts here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
// eslint-disable-next-line
console.log(
  ' Listening on http://' + nconf.get('interface') + ':' + nconf.get('port')
);
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(
  bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10 })
);

/* tiktok global observatory */
app.get(
  '/api/v3/observatory/:country',
  async (req, res) => await iowrapper(getCountryFeed, req, res)
);

/* Capture All 404 errors */
app.get('*', async (req, res) => {
  debug('URL not handled: %s', req.url);
  res.status(404);
  res.send('URL not found');
});

async function initialSanityChecks(): Promise<void> {
  /* security checks = is the password set and is not the default? (more checks might come) */
  security.checkKeyIsSet();
  await dbUtils.checkMongoWorks(true /* if true means that failure is fatal */);
  debug('TikTok Observatory backend is operative!');
}

initialSanityChecks();
