import { ParserFn } from '@shared/providers/parser.provider';
import D from 'debug';
import { MediaFile } from '../../models/metadata/MediaFile';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import { processLink } from './downloader';

const debug = D('parser:search');

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
const forYou: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
  config,
) => {
  if (previous.nature.type !== 'foryou') return null;

  const { author, description, nature, hashtags, metrics, music } = previous;

  const thumbnailSrc = envelop.jsdom
    .querySelectorAll('img[src]')[0]
    ?.getAttribute('src');

  let thumbnail: MediaFile | undefined;
  if (thumbnailSrc) {
    thumbnail = await processLink(thumbnailSrc, 'thumbnail', config);
  }

  debug('Thumbnail %s', thumbnail);

  const m = {
    ...description,
    nature,
    author,
    hashtags,
    metrics,
    music,
  };

  return m;
};

export default forYou;
