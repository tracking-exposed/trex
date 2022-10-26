import { trexLogger } from '@shared/logger';
import { ParserFn } from '@shared/providers/parser.provider';
import { throwEitherError } from '@shared/utils/fp.utils';
import _ from 'lodash';
import { NativeVideoN } from '../../models/Nature';
import { ProfileResult } from '../../models/metadata/ProfileMetadata';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import { getNatureByHref } from './nature';
import * as videoResult from './videoResult';

const debug = trexLogger.extend('parser:profile');

function getFullProfileMetadata(
  renod: ParentNode,
  order: any,
): ProfileResult | null {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink?.getAttribute('href');
  const vidnat = throwEitherError(
    getNatureByHref(vhref as any),
  ) as NativeVideoN;

  const titleel = renod.querySelector('a[title]');
  if (!titleel) return null;
  const title = titleel.getAttribute('title') ?? undefined;
  const viewsel = renod.querySelector('[data-e2e="video-views"]');
  const views = viewsel?.textContent ?? undefined;
  const img = renod.querySelector('img[alt]');
  const thumbnail = img?.getAttribute('src') ?? undefined;

  return {
    order,
    video: vidnat,
    title,
    textdesc: title,
    views,
    thumbnail,
    publishingDate: videoResult.publishingDate(img) ?? undefined,
  };
}

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
const profile: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
) => {
  if (previous.nature.type !== 'profile') return null;

  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="user-post-item"]');
  const results = _.compact(
    _.map(descs, function(elem, i) {
      return elem?.parentNode
        ? getFullProfileMetadata(elem.parentNode, i + 1)
        : null;
    }),
  );

  const retval: any = {};

  debug.debug('Video Results found in profile %d', results.length);
  if (results.length) {
    retval.amount = results.length;
    retval.results = results;
  } else {
    const errmsg = 'No results found';
    const h2 = envelop.jsdom.querySelectorAll('h2');
    // there are various 'h2' but only one can be an error
    _.each(h2, function(h) {
      if (errmsg === h.textContent) {
        retval.error = errmsg;
        retval.message = h.parentNode?.querySelector('p')?.textContent;
        // it can be 'hateful' or 'violate' but we don't know about other languages
        debug.debug('No results found: found this message: %s', retval.message);
        retval.hatespeech = !!retval?.message?.match(/hateful/);
      }
    });
  }

  return retval;
};

export default profile;
