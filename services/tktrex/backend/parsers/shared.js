const _ = require('lodash');
const debug = require('debug')('parsers:shared');
const nconf = require('nconf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

function getNatureByHref(href) {
  /* this piece of code is duplicated in extension/src/app.js */
  try {
    const urlO = new URL(href);
    const chunks = urlO.pathname.split('/');
    const retval = {};

    if (urlO.pathname === '/foryou') {
      retval.type = 'foryou';
    } else if (urlO.pathname === '/') {
      retval.type = 'foryou';
    } else if (urlO.pathname === '/following') {
      retval.type = 'following';
    } else if (chunks[2] === 'video' && chunks.length >= 3) {
      retval.type = 'video';
      retval.videoId = chunks[3];
      retval.authorId = chunks[1];
    } else if (_.startsWith(urlO.pathname, '/@')) {
      retval.type = 'creator';
      retval.creatorName = urlO.pathname.substr(1);
    } else if (urlO.pathname === '/search') {
      retval.type = 'search';
      retval.query = urlO.searchParams.get('q');
      // retval.timestamp = urlO.searchParams.get('t');
    } else if (urlO.pathname.startsWith('/tag')) {
      retval.type = 'tag';
      retval.hashtag = chunks[2];
    } else {
      debug('Unmanaged condition from URL: %o', urlO);
      return null;
    }
    // debug("getNatureByHref attributed %o", retval);
    return retval;
  } catch (error) {
    debug('Error in getNatureByHref: %s', error.message);
    return null;
  }
}

function getUUID(url, type) {
  const ui = new URL(url);
  const fullpath = ui.pathname;
  const fname = path.basename(fullpath);
  const fullname = type === 'video' ? `${fname}.mp4` : `${fname}.jpeg`;
  const cwd = process.cwd();
  if (!nconf.get('downloads')) {
    console.log("WRONG CONFIGURATION SETTINGS!! missing 'downloads' from", cwd);
    process.exit(1);
  }
  const initials = fname.substr(0, 2);
  const destdir = path.join(cwd, nconf.get('downloads'), type, initials);
  if (!fs.existsSync(destdir)) {
    try {
      fs.mkdirSync(destdir, { recursive: true });
    } catch (error) {
      debug('!? %s: %s', destdir, error.message);
    }
    debug("%s wasn't existing and have been created", destdir);
  }
  return path.join(destdir, fullname);
}

async function download(filename, url) {
  /* this is a blocking operation and it would also download
   * videos up to three minutes! */
  debug('Connecting to download (%s)', filename);
  const x = await fetch(url);
  if (x.status !== 200) {
    debug('Unexpected HTTP status %d', x.status);
    return {
      downloaded: false,
      reason: x.status,
      filename,
    };
  }
  const data = await x.buffer();
  fs.writeFileSync(filename, data);
  debug('Written file %s!', filename);
  return {
    downloaded: true,
    reason: 200,
    filename: path.relative(process.cwd(), filename),
  };
}

module.exports = {
  getNatureByHref,
  getUUID,
  download,
};
