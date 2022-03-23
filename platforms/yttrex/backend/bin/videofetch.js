#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('bin:videofetch');
const fs = require('fs');
const nconf = require('nconf');
const path = require('path');

const CSV = require('../lib/CSV');
const curly = require('../lib/curly');
const DEFAULT_FETCH_URLS = 'curlfetched';

nconf.argv().env().file({ file: 'config/settings.json' });

function guardoniFormat(e, i) {
  // the current entry is a videoId and a title
  return {
    url: `https://www.youtube.com/watch?v=${e.videoId}`,
    watchFor: '30s',
    urltag: `${i}΅ ${e.title}`,
  };
}

function simpleFormat(e) {
  return {
    videoURL: `https://www.youtube.com/watch?v=${e.videoId}`,
    title: e.title,
  };
}

function saveOptionalError(channelId, fail) {
  debug('Failure in extracting video details from channel %s', channelId);
  if (fail) {
    const dfile = path.join(DEFAULT_FETCH_URLS, `errors.txt`);
    debug('appending failure label [%s] to file %s', fail, dfile);
    fs.appendFileSync(dfile, new Date().toISOString() + ' ' + fail + '\n');
  }
}

async function vfet(channelId) {
  let selectedcontent = null;
  let dfile = null;
  const fail = nconf.get('fail');

  if (nconf.get('guardoni'))
    dfile = path.join(DEFAULT_FETCH_URLS, `guardoni-${channelId}.csv`);
  else dfile = path.join(DEFAULT_FETCH_URLS, `${channelId}-urls.csv`);

  if (fs.existsSync(dfile)) {
    // eslint-disable-next-line no-console
    return console.log(`File ${dfile} exists, quitting!`);
  }

  const htmlfile = path.join(DEFAULT_FETCH_URLS, `${channelId}-dump.html`);
  if (fs.existsSync(htmlfile)) {
    // eslint-disable-next-line no-console
    return console.log(`HTML dump file ${htmlfile} exists, quitting!`);
  }

  const retv = await curly.fetchRawChannelVideosHTML(channelId);
  if (!retv) return saveOptionalError(channelId, fail);

  const { html, statusCode } = retv;

  debug('Status %d', statusCode);
  // this option is used here and not when YCAI uses lib/curly
  const errorKeep = true;
  const titlesandId = await curly.parseRecentVideosHTML(html, errorKeep);

  // depending on the kind of failure we might save it or not
  if (!titlesandId || !titlesandId.length)
    return saveOptionalError(channelId, 'CODE ' + statusCode + ' ' + fail);
  if (titlesandId.error)
    return saveOptionalError(
      channelId,
      'CODE ' +
        statusCode +
        ' details: ' +
        ' ' +
        JSON.strigify(titlesandId.details) +
        ' ' +
        fail
    );

  if (nconf.get('guardoni'))
    selectedcontent = _.map(titlesandId, guardoniFormat);
  else selectedcontent = _.map(titlesandId, simpleFormat);

  const csvcontent = CSV.produceCSVv1(selectedcontent);
  fs.writeFileSync(dfile, csvcontent);
  debug('Produced %s with %d URLs and title', dfile, selectedcontent.length);
}

if (!nconf.get('channel')) {
  // eslint-disable-next-line no-console
  return console.log(
    'Mandatory --channel <channelId>, <--guardoni> is optional'
  );
}

vfet(nconf.get('channel'));
