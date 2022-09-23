import { trexLogger } from '@shared/logger';
import { ParserFn } from '@shared/providers/parser.provider';
import _ from 'lodash';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import {getNatureByHref} from './nature'

const debug = trexLogger.extend('parser:profile');


function getFullProfileMetadata(renod: HTMLElement, order: any): any {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink?.getAttribute('href');
  const vidnat = getNatureByHref(vhref as any);

  const titleel = renod.querySelector('a[title]');
  if (!titleel) return null;
  const title = titleel.getAttribute('title');
  const viewsel = renod.querySelector('[data-e2e="video-views"]');
  const views = viewsel?.textContent;
  const img = renod.querySelector('img[alt]');
  const thumbnail = img?.getAttribute('src');

  return {
    order,
    video: vidnat,
    title,
    views,
    thumbnail,
  };
}

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
const profile: ParserFn<HTMLSource, any, TKParserConfig> = async(envelop, previous) => {
  if (previous.nature.type !== 'profile') return false;

  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="user-post-item"]');
  const results = _.compact(
    _.map(descs, function(elem, i) {
      return getFullProfileMetadata(elem?.parentNode as any, i + 1);
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
}

export default profile;
