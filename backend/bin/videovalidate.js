#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:videofetch');
const fs = require('fs');
const nconf = require('nconf');
const path = require('path');

const CSV = require('../lib/CSV');
const {tokenFetch } = require('../lib/curly');

nconf.argv().env().file({ file: 'config/settings.json'});

async function tfet(channelId) {
  const xxx = await tokenFetch(channelId)

  debug("Produced %s", xxx);
};

tfet(nconf.get('channel'));
