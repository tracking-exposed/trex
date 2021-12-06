#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:videofetch');
const fs = require('fs');
const nconf = require('nconf');
const path = require('path');

const CSV = require('../lib/CSV');
const curly = require('../lib/curly');
const DEFAULT_EXPERIMENT = "experiments";

nconf.argv().env().file({ file: 'config/settings.json'});

function guardoniFormat(e, i) {
  // the current entry is a videoId and a title
  return {
    url: `https://www.youtube.com/watch?v=${e.videoId}`,
    watchFor: "30s",
    urltag: `${i}΅ ${e.title}`,
  }
}

function simpleFormat(e) {
  return {
    videoURL: `https://www.youtube.com/watch?v=${e.videoId}`,
    title: e.title,
  }
}

async function vfet(channelId) {
  let selectedcontent = null;
  let dfile = null;

  if(nconf.get('guardoni'))
    dfile = path.join(DEFAULT_EXPERIMENT, `guardoni-${channelId}.csv`);
  else
    dfile = path.join(DEFAULT_EXPERIMENT, `${channelId}-urls.csv`);

  if(fs.existsSync(dfile)) {
    // eslint-disable-next-line no-console
    return console.log(`File ${dfile} exists, quitting!`);
  }

  const htmlfile = path.join(DEFAULT_EXPERIMENT, `${channelId}-dump.html`);
  if(fs.existsSync(htmlfile)) {
    // eslint-disable-next-line no-console
    return console.log(`HTML dump file ${htmlfile} exists, quitting!`);
  }

  const { html, statusCode } = await curly.fetchRawChannelVideosHTML(channelId);

  debug("Status %d", statusCode);
  const titlesandId = await curly.parseRecentVideosHTML(html);

  if(!titlesandId) {
    debug("Failure in extracting video details from channel %s", channelId);
    return;
  }

  if(nconf.get('guardoni'))
    selectedcontent = _.map(titlesandId, guardoniFormat);
  else
    selectedcontent = _.map(titlesandId, simpleFormat);

  const csvcontent = CSV.produceCSVv1(selectedcontent);
  fs.writeFileSync(dfile, csvcontent);
  debug("Produced %s with %d URLs and title",
    dfile, selectedcontent.length);
};

if(!nconf.get('channel')) {
  // eslint-disable-next-line no-console
  return console.log("Mandatory --channel <channelId>, <--guardoni> is optional");
}

vfet(nconf.get('channel'));
