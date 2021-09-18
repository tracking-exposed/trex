#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:ogresolver');
const fetchOpengraph = require('fetch-opengraph');
const nconf = require('nconf');

nconf.argv().env().file({ file: 'config/settings.json'});

async function start() {

  for (pourl of process.argv) {
    if(_.startsWith(pourl, 'https://')) {
      debug("Fetching %s", pourl);
      const result = await fetchOpengraph.fetch(pourl);
      const fields = ['title', 'description', 'url', 'image']
      const keep = _.pick(result, fields);
      console.log(keep.title);
    }
  };
}


try {
  start();
} catch(error) {
  debug("Unexpected error: %s", error.message);
}
