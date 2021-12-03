const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('parsers:downloader');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

function getUUID(url, type) {
  const ui = new URL(url);
  const fullpath = ui.pathname;
  const fname = path.basename(fullpath);
  const fullname = type === 'video' ? `${fname}.mp4` : `${fname}.jpeg`;
  const cwd = process.cwd();
  if(!nconf.get('downloads')) {
    console.log("WRONG CONFIGURATION SETTINGS!! missing 'downloads' from", cwd);
    process.exit(1);
  }
  const initials = fname.substr(0, 2);
  const destdir = path.join(cwd, nconf.get('downloads'), type, initials );
  if(!fs.existsSync(destdir)) {
    try {
      fs.mkdirSync(destdir, { recursive: true });
    } catch(error) {
      debug("!? %s: %s", destdir, error.message);
    }
    debug("%s wasn't existing and have been created", destdir);
  }
  const destf = path.join(destdir, fullname);
  return destf;
}

async function download(filename, url) {
  /* this is a blocking operation and it would also download 
   * videos up to three minutes! */
  debug("Connecting to download (%s)", filename);
  const x = await fetch(url);
  if(x.status !== 200) {
    debug("Unexpected HTTP status %d", x.status)
    return {
      downloaded: false,
      reason: x.status,
      filename,
    }
  }
  const data = await x.buffer();
  fs.writeFileSync(filename, data);
  debug("Written file %s!", filename);
  return {
    downloaded: true,
    reason: 200,
    filename: path.relative(process.cwd(), filename),
  }
}

async function downloader(envelop, previous) {

  if(previous.nature.type !== 'video')
    return null;

  const retval = {
    thumbnail: null,
    video: null,
  };

  const jpegauthlink = envelop.jsdom.querySelector('img').getAttribute('src')
  // 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/165cab84498d4e63aba08d38962eee1c_1634128242?x-expires=1638378000&x-signature=iUMJIPbfQ%2FTTWxeDE8boFRK2wsM%3D'
  const jpeguuid = getUUID(jpegauthlink, 'thumbnail');
  if(!fs.existsSync(jpeguuid)) {
    retval.thumbnail = await download(jpeguuid, jpegauthlink);
  } else {
    retval.thumbnail = {
      downloaded: true,
      filename: path.relative(process.cwd(), jpeguuid),
      reason: 0,
    }
  }

  const mp4authlink = envelop.jsdom.querySelector('video').getAttribute('src')
  // 'https://v39-eu.tiktokcdn.com/33ec64c1bbbb5f44b155645e81efce20/61a7b1fa/video/tos/useast2a/tos-useast2a-ve-0068c001/2c2c30153863424f8223b437c9320afb/?a=1233&br=1028&bt=514&cd=0%7C0%7C1&ch=0&cr=0&cs=0&cv=1&dr=0&ds=3&er=&ft=wZ~R_F5qkag3-I&l=20211201113200010223016048091254BE&lr=tiktok_m&mime_type=video_mp4&net=0&pl=0&qs=0&rc=M3k1cWU6Zm9nODMzNzczM0ApOzc1ZWc8M2Q6N2k3aTkzNWdvbHItcjRnL2dgLS1kMTZzczZfMS5gLWAwYDNhYWMwLV46Yw%3D%3D&vl=&vr='
  const mp4uuid = getUUID(mp4authlink, 'video');
  if(!fs.existsSync(mp4uuid)) {
    retval.video = await download(mp4uuid, mp4authlink);
  } else {
    retval.video = {
      downloaded: true,
      filename: path.relative(process.cwd(), mp4uuid),
      reason: 0,
    }
  }

  return retval;
}

module.exports = downloader;
