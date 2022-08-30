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
const dest = nconf.get('dest') || 'http://localhost:10000';
const destUrl = `${dest}/api/v2/events`;

debug('Fetching %s for %s', sourceUrl, dest);
return request
  .getAsync({ url: sourceUrl, rejectUnauthorized: false })
  .then(function (res) {
    // debug("Download completed (%d)", _.size(res.body) );
    return res.body;
  })
  .then(JSON.parse)
  .then(function (e) {
    if (!e.content) process.exit(0);
    // debug("Retrieved %d elements", _.size(e.content) );
    return e.content;
  })
  .map(
    function (copiedReq) {
      return request
        .postAsync(destUrl, {
          json: copiedReq.body,
          headers: copiedReq.headers,
        })
        .then(function (result) {
          if (result.body && result.body.supporter)
            debug(
              'OK %s: %s',
              copiedReq.headers['x-tktrex-version'],
              result.body.supporter.p
            );
          else
            debug(
              '?? %s - %j',
              copiedReq.headers['x-tktrex-version'],
              result.body
            );
        });
    },
    { }
  )
  .catch(function (error) {
    debug('――― [E] %s', error.message, new Date());
  });
