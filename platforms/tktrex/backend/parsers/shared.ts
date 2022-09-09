import {
  FollowingN,
  ForYouN,
  HashtagsN,
  NativeVideoN,
  Nature,
  ProfileN,
  SearchN,
  VideoN,
} from '@tktrex/shared/models/Nature';
import D from 'debug';
import _ from 'lodash';
import nconf from 'nconf';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const debug = D('parsers:shared');

export function getNatureByHref(href: string): Nature | null {
  /* this piece of code is duplicated in extension/src/app.js */
  try {
    const urlO = new URL(href);
    const chunks = urlO.pathname.split('/');
    let retval: Nature = {
      nature: { type: undefined },
      type: undefined,
    } as any;

    if (urlO.pathname === '/' || urlO.pathname === '/foryou') {
      const foryouNature: ForYouN = {
        type: 'foryou',
      };
      retval = foryouNature;
    } else if (urlO.pathname === '/following') {
      const followingNature: FollowingN = {
        type: 'following',
      };
      retval = followingNature;
    } else if (chunks[2] === 'video' && chunks.length >= 3) {
      const videoNature: NativeVideoN = {
        type: 'native',
        videoId: chunks[3],
        authorId: chunks[1],
      };
      retval = videoNature;
    } else if (_.startsWith(urlO.pathname, '/@') && chunks.length === 2) {
      const profileNature: ProfileN = {
        type: 'profile',
        creatorName: chunks[1].substring(1),
      };
      retval = profileNature;
    } else if (urlO.pathname === '/search') {
      const searchNature: SearchN = {
        type: 'search',
        query: urlO.searchParams.get('q'),
      };
      retval = searchNature;
      // retval.timestamp = urlO.searchParams.get('t');
    } else if (urlO.pathname.startsWith('/tag')) {
      const hashtagsN: HashtagsN = {
        type: 'tag',
        hashtag: chunks[2],
      };
      retval = hashtagsN;
    } else {
      debug('Unmanaged condition from URL: %o', urlO);
      return null;
    }
    // debug("getNatureByHref attributed %o", retval);
    return retval;
  } catch (error: any) {
    debug('Error in getNatureByHref: %s', error.message);
    return null;
  }
}

export function getUUID(url: string, type: any): any {
  const ui = new URL(url);
  const fullpath = ui.pathname;
  const fname = path.basename(fullpath);
  const fullname = type === 'video' ? `${fname}.mp4` : `${fname}.jpeg`;
  const cwd = process.cwd();
  if (!nconf.get('downloads')) {
    /* eslint-disable no-console */
    console.log("WRONG CONFIGURATION SETTINGS!! missing 'downloads' from", cwd);
    process.exit(1);
  }
  const initials = fname.substr(0, 2);
  const destdir = path.join(cwd, nconf.get('downloads'), type, initials);
  if (!fs.existsSync(destdir)) {
    try {
      fs.mkdirSync(destdir, { recursive: true });
    } catch (error: any) {
      debug('!? %s: %s', destdir, error.message);
    }
    debug("%s wasn't existing and have been created", destdir);
  }
  return path.join(destdir, fullname);
}

export async function download(filename: string, url: string): Promise<any> {
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
  debug('Successfully downloaded %s and written file %s', url, filename);
  return {
    downloaded: true,
    reason: 200,
    filename: path.relative(process.cwd(), filename),
  };
}
