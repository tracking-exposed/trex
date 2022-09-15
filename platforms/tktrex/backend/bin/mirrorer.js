#!/usr/bin/env node

/* eslint-disable */
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('tktrex:mirrorer');
var request = Promise.promisifyAll(require('request'));
var nconf = require('nconf');

nconf.argv().env();

if (!nconf.get('key')) return console.log('--key required');

const source = nconf.get('source') || 'https://tiktok.tracking.exposed';
const sourceUrl = `${source}/api/v1/mirror/${nconf.get('key')}/`;
const dest = nconf.get('dest') || 'http://localhost:14000';
const destUrl = `${dest}/api/v2/events`;

async function main() {
  debug('Fetching %s for %s', sourceUrl, dest);
  const res = await request.getAsync({
    url: sourceUrl,
    rejectUnauthorized: false,
  });
  debug('Download completed (%d)', _.size(res.body));
  let json = null;
  try {
    json = JSON.parse(res.body);
  } catch (error) {
    console.log(`Quitting: ${error.message}`);
    console.log(res.body);
    process.exit(1);
  }
  if (!json.content) {
    debug('No content present');
    process.exit(0);
  }

  for (const copiedReq of json.content) {
    const result = await request.postAsync(destUrl, {
      json: copiedReq.body,
      headers: copiedReq.headers,
    });
    if (result.body && result.body.supporter) {
      debug(
        'OK %s: %s',
        copiedReq.headers['x-tktrex-version'],
        result.body.supporter.p
      );
    } else {
      debug('?? %s - %j', copiedReq.headers['x-tktrex-version'], result.body);
    }
  }
  // debug('――― [E] %s', error.message, new Date());
}

main();
