import { ParserFn } from '@shared/providers/parser.provider';
import _ from 'lodash';
import D from 'debug';
import { HTMLSource } from '../lib/parser';
import { getUUID, download } from './shared';
import fs from 'fs';
import path from 'path';
import { TKParserConfig } from './config';

const debug = D('parser:downloader');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function processLink({
  link,
  linkType,
  config,
}: {
  link: any;
  linkType: any;
  config: TKParserConfig;
}) {
  // link is either an mp4 or a jpeg,
  // linkType is 'video' or 'thumbnail'
  const fuuid = getUUID(link, linkType, config.downloads ?? '');
  if (config.downloads) {
    if (!fs.existsSync(fuuid)) return await download(fuuid, link);
  }

  return {
    downloaded: true,
    filename: path.relative(process.cwd(), fuuid),
    reason: 0,
    // a cached file has reason 0
  };
}

/*
async function downloadVideoNative(envelop) {
  const retval = {};

  const jpegauthlink = envelop.jsdom.querySelector('img').getAttribute('src');
  retval.thumbnail = await processLink(jpegauthlink, 'thumbnail');
  const mp4authlink = envelop.jsdom.querySelector('video').getAttribute('src');
  retval.video = await processLink(mp4authlink, 'video');

  return retval;
}

async function downloadVideoSelected(searchFinding) {
  // selected: {
  //   videoId: '7034225944881646854',
  //   href: 'https://www.tiktok.com/@mia.kkhalifa/video/7034225944881646854',
  //   thumbnail: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/1e6d261af8454fc190c4c7d053f30859?x-expires=1638597600&x-signature=QgDjdwR8lHSyGux51DsrfMzsEXE%3D',
  //   video: 'https://v16-web.tiktok.com/video/tos/useast2a/tos-useast2a-ve-0068c003/d3df2e2e66144eea98fdd0f0c03e47db/?a=1988&br=1272&bt=636&cd=0%7C0%7C0&ch=0&cr=0&cs=0&dr=0&ds=1&er=&expire=1638599571&ft=wUyFfF5qkag3-I&l=202112040032440101920511470F6753C2&lr=tiktok_m&mime_type=video_mp4&net=0&pl=0&policy=3&qs=0&rc=M29mazY6Zjo8OTMzNzczM0ApaGk0OjhkZGQ8Nzo6NDdlM2dyNWhucjRvYGNgLS1kMTZzc2AtXzIyLjJeMTItY140NDM6Yw%3D%3D&signature=59fc92c6475f92305444a01967491bf9&tk=6773671102751409157&vl=&vr='
  // } 
  const retval = {};

  retval.thumbnail = await processLink(
    searchFinding.selected.thumbnail,
    'thumbnail'
  );
  retval.video = await processLink(searchFinding.selected.video, 'video');

  return retval;
}
*/

const downloader: ParserFn<
  HTMLSource,
  { downloader: any[] },
  TKParserConfig
> = async (envelop, findings, config) => {
  if (envelop.supporter.version !== '2.6.2.99') {
    // TODO we should load a JSON with some more complex filtering mechanism
    debug('Only development version .99 is now considered for download!');
    return null;
  }

  if (findings?.native?.nature.type !== 'native') {
    debug('Only native videos are currently considered for donwload');
    return null;
  }
  const imageNodes = envelop.jsdom.querySelectorAll('img[src]');

  if (!imageNodes || imageNodes.length === 0) {
    debug('Not found thumbnail!');
    return null;
  }

  const retval = [];
  for (const img of imageNodes) {
    const url = img.getAttribute('src');
    const alt = img.getAttribute('alt');

    const info = await processLink({
      link: url,
      linkType: 'thumbnail',
      config,
    });
    info.url = url;
    if (alt?.length) info.alt = alt;

    retval.push(info);
  }

  debug(
    'reported as downloaded %d links (%O)',
    retval.length,
    _.countBy(retval, 'reason')
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
