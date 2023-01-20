import { ParserFn } from '@shared/providers/parser';
import { HTMLSource } from '../source';
import { Metrics } from '../../models/metadata/Metrics';
import { TKParserConfig } from '../config';

const metrics: ParserFn<HTMLSource, Metrics, TKParserConfig> = async(
  envelop,
  previous,
) => {
  /* 2.4.x 'foryou' and 'following' are considered only */
  const availin = ['foryou', 'following', 'video', 'native'];

  if (previous.nature && !availin.includes(previous.nature.type)) {
    // debug('No numbers in previous.nature %o', previous.nature);
    return null;
  }

  let likee: HTMLElement | null, commente: HTMLElement | null;
  if (previous.nature.type === 'native') {
    likee = envelop.jsdom.querySelector(
      'div[class*="DivBrowserModeContainer"] [data-e2e*="like-count"]',
    );
    commente = envelop.jsdom.querySelector(
      'div[class*="DivBrowserModeContainer"] [data-e2e*="comment-count"]',
    );
  } else {
    likee = envelop.jsdom.querySelector('[data-e2e="like-count"]');
    commente = envelop.jsdom.querySelector('[data-e2e="comment-count"]');
  }

  const sharee = envelop.jsdom.querySelector('[data-e2e="share-count"]');

  const liken = likee?.textContent ?? null;
  const commentn = commente?.textContent ?? null;
  const sharen = sharee?.textContent ?? null;

  return {
    liken,
    commentn,
    sharen,
  };
};

export default metrics;
