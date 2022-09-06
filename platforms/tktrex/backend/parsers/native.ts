import { ParserFn } from '@shared/providers/parser.provider';
import D from 'debug';
import _ from 'lodash';
import { HTMLSource } from '../lib/parser';
import parseAuthor from './author';
import parseDescription from './description';
import parseHashtags from './hashtags';
import parseMusic from './music';
import parseMetrics from './numbers';

const debug = D('parser:native');

const parseNativeVideo: ParserFn<HTMLSource, any> = async (
  envelop,
  findings
) => {
  debug(
    'processing native video entry %O %O',
    _.omit(envelop, ['html.html', 'jsdom']),
    findings
  );

  if (envelop.html.type !== 'native') {
    debug('entry is not "native" (%s)', envelop.html.type);
    return null;
  }

  const music = await parseMusic(envelop, findings);
  const author = await parseAuthor(envelop, findings);
  const description = await parseDescription(envelop, findings);
  const metrics = await parseMetrics(envelop, findings);
  const hashtags = await parseHashtags(envelop, findings);

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
