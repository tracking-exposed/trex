import { map } from 'lodash';
import { ParserFn } from '@shared/providers/parser';
import type { HTMLSource } from '../source';
import type { TKParserConfig } from '../config';
import D from 'debug';

const debug = D('parsers:hashtags');

const hashtags: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
) => {
  /* only feed 'foryou' and 'following' have a description */
  const availin = ['foryou', 'following', 'video', 'native'];

  if (previous.nature && !availin.includes(previous.nature.type)) {
    // debug('No hashtags for previous.nature %o', previous.nature);
    return null;
  }

  let hashtags;
  if (previous.nature.type === 'native') {
    hashtags = envelop.jsdom.querySelectorAll(
      'div[class*="DivBrowserModeContainer"] a[href^="/tag/"]',
    );
  } else {
    hashtags = envelop.jsdom.querySelectorAll('a[href^="/tag/"]');
  }
  const results = map(hashtags, function(anode) {
    if ((anode.textContent?.length ?? 0) > 1) return anode.textContent;
  });

  if (results.length) {
    debug('hashtags %d %j', results.length, results);
    return results;
  }

  return null;
};

export default hashtags;
