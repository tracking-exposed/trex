import { ParserFn } from '@shared/providers/parser.provider';
import D from 'debug';
import { HTMLSource } from '../lib/parser';
import parseAuthor from './author';
import parseHashtags from './hashtags';
import parseMusic from './music';
import parseMetrics from './numbers';

const debug = D('parser:native');

const parseNativeVideo: ParserFn<HTMLSource, any> = async (
  envelop,
  findings
) => {
  if (envelop.html.type !== 'native') {
    debug('entry is not "native" (%s)', envelop.html.type);
    return null;
  }
  debug('processing native video entry: %s', envelop.html.href);

  const music = await parseMusic(envelop, findings);
  const author = await parseAuthor(envelop, findings);
  const metrics = await parseMetrics(envelop, findings);
  const hashtags = await parseHashtags(envelop, findings);

  // description is already available at this point!
  // const description = await parseDescription(envelop, findings);
  const description = findings.description;

  return {
    nature: { type: 'native' },
    type: 'native',
    ...music,
    ...author,
    ...description,
    ...metrics,
    ...hashtags,
  };
};

export default parseNativeVideo;
