import {
  ContributionWithDOM,
  ParserFn,
} from '@shared/providers/parser';
import D from 'debug';
import { HTMLSource } from '../source';
import { TKParserConfig } from '../config';
import { MediaFile } from '../../models/metadata/MediaFile';
import { processLink } from './downloader';

const debug = D('parser:native');

async function downloadVideoNative(
  envelop: ContributionWithDOM<HTMLSource>,
  config: TKParserConfig,
): Promise<{ thumbnail: MediaFile | undefined }> {
  const retval: any = {
    thumbnail: undefined,
  };

  const jpegauthlink = envelop.jsdom.querySelector('img')?.getAttribute('src');
  if (jpegauthlink) {
    retval.thumbnail = await processLink(jpegauthlink, 'thumbnail', config);
  }

  // TODO: not sure we want to download the mp4 of every video we collect

  // const mp4authlink = envelop.jsdom.querySelector('video').getAttribute('src');
  // if (mp4authlink) {
  //   retval.video = await processLink(mp4authlink, 'video');
  // }

  return retval;
}

const parseNativeVideo: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  findings,
  config,
) => {
  if (findings.nature.type !== 'native') {
    debug('entry is not "native" (%s)', findings.nature.type);
    return null;
  }
  debug('processing native video entry: %s %O', envelop.html.href, findings);

  const { thumbnail } = await downloadVideoNative(envelop, config);
  const { nature, music, author, metrics, hashtags, description } = findings;

  return {
    nature,
    ...nature,
    music,
    author,
    ...description,
    metrics,
    hashtags,
    thumbnail,
  };
};

export default parseNativeVideo;
