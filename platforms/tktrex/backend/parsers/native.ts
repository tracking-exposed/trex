import { ParserFn } from '@shared/providers/parser.provider';
import D from 'debug';
import { HTMLSource } from '../lib/parser';

const debug = D('parser:native');

const parseNativeVideo: ParserFn<HTMLSource, any> = async (
  envelop,
  findings
) => {
  if (findings.nature.type !== 'native') {
    debug('entry is not "native" (%s)', findings.nature.type);
    return null;
  }
  debug('processing native video entry: %s %O', envelop.html.href, findings);

  const { music, author, metrics, hashtags, description } = findings;

  return {
    nature: { type: 'native' },
    type: 'native',
    music,
    author,
    ...description,
    metrics,
    hashtags,
  };
};

export default parseNativeVideo;
