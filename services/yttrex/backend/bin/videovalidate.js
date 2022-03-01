#!/usr/bin/env node
const debug = require('debug')('bin:videofetch');
const nconf = require('nconf');

const {tokenFetch } = require('../lib/curly');

nconf.argv().env().file({ file: 'config/settings.json'});

async function tfet(channelId) {
  const xxx = await tokenFetch(channelId)

  debug("Produced %s", xxx);
};

tfet(nconf.get('channel'));
