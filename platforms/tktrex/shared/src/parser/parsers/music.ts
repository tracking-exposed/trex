import { ParserFn } from '@shared/providers/parser.provider';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import D from 'debug';

const debug = D('parsers:music');

const musicSelector = 'a[href^="/music/"]';

const music: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
) => {
  /* 'foryou' 'following' and 'video' shares same pattern */
  const availin = ['foryou', 'following', 'video', 'native'];

  if (previous.nature && !availin.includes(previous.nature.type)) {
    // debug("No music for previous.nature %o", previous.nature);
    return null;
  }

  let elem;
  if (previous.nature.type === 'native') {
    elem = envelop.jsdom.querySelector(
      `div[class*="DivBrowserModeContainer"] ${musicSelector}`,
    );
  } else {
    elem = envelop.jsdom.querySelector(musicSelector);
  }

  if (!elem) {
    debug(
      'No music in a tiktok!? investigate: %s %d',
      envelop.html.id,
      envelop.html.html.length,
    );
    return null;
  }

  const url = elem.getAttribute('href');
  const name = elem.textContent;

  return {
    url,
    name,
  };
};

export default music;
