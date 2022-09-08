import { ParserFn } from '@shared/providers/parser.provider';
import D from 'debug';
import { HTMLSource } from '../lib/parser';

const debug = D('parser:native');

const parseNativeVideo: ParserFn<HTMLSource, any> = async (
  envelop,
  findings
) => {
  if (envelop.html.type !== 'native') {
    debug('entry is not "native" (%s)', envelop.html.type);
    return null;
  }
  debug('processing native video entry: %s %O', envelop.html.href, findings);

  const music = findings.music;
  const author = findings.author;
  const metrics = findings.metrics;
  const hashtags = findings.hashtags;
  const description = findings.description.description;
  const baretext = findings.description.baretext;

  return {
    nature: { type: 'native' },
    type: 'native',
    music,
    author,
    description,
    baretext,
    metrics,
    hashtags,
  };
};

export default parseNativeVideo;
