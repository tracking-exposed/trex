import { ParserFn } from '@shared/providers/parser';
import _ from 'lodash';
import D from 'debug';
import { HTMLSource } from '../source';
import { getUUID, download } from './shared';
import fs from 'fs';
import path from 'path';
import { TKParserConfig } from '../config';
import { MediaFile } from '../../models/metadata/MediaFile';

const debug = D('parser:downloader');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function processLink(
  link: string,
  linkType: string,
  config: TKParserConfig,
): Promise<MediaFile> {
  // link is either an mp4 or a jpeg,
  // linkType is 'video' or 'thumbnail'

  const fuuid = getUUID(link, linkType, config.downloads);

  if (config.downloads && fuuid) {
    if (!fs.existsSync(fuuid)) return await download(fuuid, link);

    return {
      downloaded: true,
      filename: path.relative(process.cwd(), fuuid),
      reason: 0,
      // a cached file has reason 0
    };
  }
  return {
    downloaded: false,
    filename: undefined,
    reason: 500,
  };
}

const downloader: ParserFn<
  HTMLSource,
  { downloader: any[] },
  TKParserConfig
> = async(envelop, findings, config) => {
  // if (envelop.supporter.version !== '2.6.2.99') {
  //   // TODO we should load a JSON with some more complex filtering mechanism
  //   debug('Only development version .99 is now considered for download!');
  //   return null;
  // }

  debug('Findings %O', findings);
  // if (findings?.native?.nature.type !== 'search') {
  //   debug('Only native videos are currently considered for donwload');
  //   return null;
  // }

  const imageNodes = envelop.jsdom.querySelectorAll('img[src]');

  if (!imageNodes || imageNodes.length === 0) {
    debug('Not found thumbnail!');
    return null;
  }

  const retval = [];
  for (const img of Array.from(imageNodes)) {
    const url = img.getAttribute('src');
    if (url) {
      const alt = img.getAttribute('alt');

      const info: any = await processLink(url, 'thumbnail', config);
      info.url = url;
      if (alt?.length) info.alt = alt;

      retval.push(info);
    }
  }

  debug(
    'reported as downloaded %d links (%O)',
    retval.length,
    _.countBy(retval, 'reason'),
  );
  return { downloader: retval };
};

/*
  if (envelop.nature.type === 'video') {
    retval = await downloadVideoNative(envelop);
    debug(
      'video avail %d download %d | thumbnail avail %d download %d',
      retval.video.downloaded,
      retval.video.reason,
      retval.thumbnail.downloaded,
      retval.thumbnail.reason
    );
  } else if (previous.nature.type === 'search') {
    retval = { thumbnails: [] };
    // this nesting would be inherit in metadata
    for (const result of previous.search.results || []) {
      const fildata = await processLink(result.thumbnail, 'thumbnail');
      retval.thumbnails.push(fildata);
    }
    debug(
      'No download of all the search results videos, but done %d thumbnails',
      retval.thumbnails.length
    );
    if (!retval.thumbnails.length) return null;
  }

  return retval;
  */

export default downloader;
