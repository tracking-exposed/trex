#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:videofetch');
const fs = require('fs');
const nconf = require('nconf');
const path = require('path');

const CSV = require('../lib/CSV');
const { experimentalFetch } = require('../lib/curly');

nconf.argv().env().file({ file: 'config/settings.json'});

async function vfet(channelId) {
  const titlesandId = await experimentalFetch(channelId)

  if(!titlesandId) {
    debug("Failure in extracting video details from channel %s", channelId);
    return { json: { error: true, message: "Failure in extracting info from YouTube; investigate"}}
  }

  const urltitle = _.map(titlesandId, function(e) {
    return {
      videoURL: 'https://www.youtube.com/watch?v=' + e.videoId,
      title: e.title,
    }
  });

  const csvcontent = CSV.produceCSVv1(urltitle);
  const dfile = path.join('experiments', channelId + '-urls.csv');
  fs.writeFileSync(dfile, csvcontent);

  debug("Produced %s", dfile);
};

vfet(nconf.get('channel'));
