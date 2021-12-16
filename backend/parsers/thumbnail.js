const _ = require('lodash');
const debug = require('debug')('parsers:thumbnail');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

/* if(!nconf.get('thumbnails')) {
     console.log("WRONG CONFIGURATION SETTINGS!! missing 'downloads' from", cwd);
     process.exit(1);
   } 
   'thumbnails' is a git forced directory and it is not created, but 
                it can/should be a nconf                     */


function getUUID(videoId) {
  /* imported from tiktok parsers, shared file, then refactor */
  const filename = `${videoId}.jpeg`;
  const cwd = process.cwd();
  const initials = videoId.substr(0, 2);
  const destdir = path.join(cwd, 'thumbnails', initials);
  if(!fs.existsSync(destdir)) {
    try {
      fs.mkdirSync(destdir, { recursive: true });
    } catch(error) {
      debug("mkdirSync error in %s: %s", destdir, error.message);
    }
  }
  const fullpath = path.join('thumbnails', videoId.substr(0, 2), filename);
  return path.relative(cwd, fullpath);
}

async function downloadIfNew(videoId) {
    const filename = getUUID(videoId);
    if(fs.existsSync(filename))
        return { videoId, downloaded: true, reason: 0, filename };

    const url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const x = await fetch(url);
    if(x.status !== 200) {
        debug("Unacceptable HTTP status %d", x.status)
        return {
            videoId,
            downloaded: false,
            reason: x.status,
            filename,
        }
    }
    const data = await x.buffer();
    fs.writeFileSync(filename, data);
    debug("Status 200: written file %s!", filename);
    return {
        videoId,
        downloaded: true,
        reason: 200,
        filename,
    }
}

async function downloadFromVideoId(videoIds) {
    const retval = [];
    for(const videoId of videoIds) {
        const ret = await downloadIfNew(videoId);
        retval.push(ret);
    }
    return retval;
}

async function conditionalDownload(analysis) {
    const retval = [];
    for (const entry of analysis) {
        if(entry.length > 0 && entry[1]?.experiment?.experimentId) {
            if(entry[1].type === 'search') {
                const r = await downloadFromVideoId(_.map(entry[1].results, 'videoId'));
                retval.push(r);
            }
            else if(entry[1].type === 'video') {
                const r = await downloadFromVideoId(_.map(entry[1].related, 'videoId'));
                retval.push(r);
            }
            else if(entry[1].type === 'home') {
                const r = await downloadFromVideoId(_.map(entry[1].selected, 'videoId'));
                retval.push(r);
            }
            else
                return [];
        }
    }
    return retval;
}

module.exports = conditionalDownload;
