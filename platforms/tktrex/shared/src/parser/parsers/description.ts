import {
  ContributionWithDOM,
  ParserFn,
} from '@shared/providers/parser.provider';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import _ from 'lodash';
import { trexLogger } from '@shared/logger';

const debug = trexLogger.extend('parsers:description');

function videoDescriptionGuess(envelop: ContributionWithDOM<HTMLSource>): {
  description: string;
} | null {
  /* uno, due and tre are three different attempt to find a description */
  const uno = envelop.jsdom.querySelector('[data-e2e="browse-video-desc"]');
  const due = envelop.jsdom.querySelector('[data-e2e="video-desc"]');
  const tre = envelop.jsdom.querySelectorAll('img');
  /* and this is to sort by the longest available */
  const treTopSize = _.sortBy(tre, function(i) {
    const alt = i.getAttribute('alt');
    return alt?.length;
  });
  let retval = null;
  if (uno) {
    debug.debug('format kind (1): %s', uno.textContent);
    retval = { description: uno.textContent };
  } else if (due) {
    debug.debug('format kind (2): %s', due.textContent);
    retval = { description: due.textContent };
  } else if (tre && treTopSize.length) {
    debug.debug(
      'format kind (3), picking the first of %j',
      _.compact(
        _.map(treTopSize, function(o) {
          return o.getAttribute('alt');
        }),
      ),
    );
    retval = { description: treTopSize[0].getAttribute('alt') };
  } else {
    debug.debug('All the extraction approaches failed');
    return null;
  }
  return retval as any;
}

const description: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
) => {
  /* the 'video' have a different structure and should be better
   * handled this diversity of possibility */
  if (previous.nature && ['native', 'video'].includes(previous.nature.type)) {
    return videoDescriptionGuess(envelop);
  }

  /* otherwise 'foryou' and 'following' have a description */
  const availin = ['foryou', 'following'];

  if (previous.nature && !availin.includes(previous.nature.type)) {
    debug.debug('No description for previous.nature %o', previous.nature);
    return null;
  }

  const spans = envelop.jsdom.querySelectorAll('span');
  const texts = _.map(spans, function(span) {
    return (span.textContent?.length ?? 0) > 0 ? span.textContent : null;
  });

  const textElems = envelop.jsdom.querySelector(
    '[data-e2e="video-desc"], [data-e2e="search-card-video-caption"]',
  );
  if (!textElems) return null;

  const fullText = textElems.textContent;
  debug.debug('bareText: %j fullText [%s]', _.compact(texts), fullText);
  const nohashtagText = texts.join('').trim();

  return {
    description: fullText,
    baretext: nohashtagText,
  };
};

export default description;
