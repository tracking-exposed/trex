import D from 'debug';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

const debug = D('parsers:shared');

export function getUUID(
  url: string,
  type: any,
  downloads: string | undefined,
): string | null {
  const ui = new URL(url);
  const fullpath = ui.pathname;
  const fname = path.basename(fullpath);
  const fullname = type === 'video' ? `${fname}.mp4` : `${fname}.jpeg`;
  const cwd = process.cwd();
  if (!downloads) {
    /* eslint-disable no-console */
    console.log('WRONG CONFIGURATION SETTINGS!! missing \'downloads\' from', cwd);
    return null;
  }
  const initials = fname.substr(0, 2);
  const destdir = path.join(cwd, downloads, type, initials);
  if (!fs.existsSync(destdir)) {
    try {
      fs.mkdirSync(destdir, { recursive: true });
    } catch (error: any) {
      debug('!? %s: %s', destdir, error.message);
      return null;
    }
    debug('%s wasn\'t existing and have been created', destdir);
  }
  return path.join(destdir, fullname);
}

export async function download(
  filename: string,
  url: string,
): Promise<{
  downloaded: boolean;
  reason: number;
  filename: string;
}> {
  /* this is a blocking operation and it would also download
   * videos up to three minutes! */
  debug('Connecting %s to download (%s)', url, filename);
  const x = await axios.get(url, { responseType: 'arraybuffer' });
  if (x.status !== 200) {
    debug('Unexpected HTTP status %d', x.status);
    return {
      downloaded: false,
      reason: x.status,
      filename,
    };
  }

  fs.writeFileSync(filename, x.data);
  debug('Successfully downloaded %s and written file %s', url, filename);
  return {
    downloaded: true,
    reason: 200,
    filename: path.relative(process.cwd(), filename),
  };
}
