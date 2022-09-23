import { ParserFn } from '@shared/providers/parser.provider';
import { throwEitherError } from '@shared/utils/fp.utils';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import _ from 'lodash';
import D from 'debug';
import { getNatureByHref } from './nature';
const debug = D('parser:search');

function getFullSearchMetadata(renod: HTMLElement, order: any): any {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink?.getAttribute('href');
  const vidnat = getNatureByHref(vhref as any);

  const fdesc = renod.querySelector('[data-e2e="search-card-video-caption"]');
  const textdesc = fdesc?.textContent;
  const links = renod.querySelectorAll('a');
  const linked = _.map(links, function(l) {
    const asreported = l.getAttribute('href');
    const tkhref =
      asreported && _.startsWith(asreported, '/')
        ? 'https://www.tiktok.com' + asreported
        : asreported;
    const linkNature = throwEitherError(getNatureByHref(tkhref as any));
    return {
      link: linkNature,
      desc: l.textContent,
    };
  });
  const img = renod.querySelector('img[alt]');
  const thumbnail = img?.getAttribute('src');

  const publishingDate = _.reduce<any, string | null>(
    img?.parentNode?.parentNode?.childNodes ?? [],
    function(memo, n) {
      if (!memo && n.textContent.trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/))
        memo = n.textContent;
      if (!memo && n.textContent.trim().match(/(\d{1,2})-(\d{1,2})/))
        memo = new Date().getFullYear() + '-' + n.textContent;
      return memo;
    },
    null,
  );

  /* investigation why sometime the publishingDate is null,
     seems sometime tiktok returns M-DD format ? */
  if (!publishingDate)
    debug(
      'failed parsing: %s',
      JSON.stringify(
        _.map(img?.parentNode?.parentNode?.childNodes, 'textContent'),
      ),
    );

  return {
    order,
    video: vidnat,
    textdesc,
    linked,
    thumbnail,
    publishingDate: publishingDate
      ? new Date(publishingDate).toISOString()
      : null,
  };
}

/* this is returning a bunch of native information,
 * perhaps might be splitted in appropriate files.
 * videoId, error messages, comment disabled, etc */
const search: ParserFn<HTMLSource, any, TKParserConfig> = async(
  envelop,
  previous,
) => {
  if (previous.nature.type !== 'search') return false;

  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="search-card-desc"]');
  const results = _.map(descs, function(elem, i) {
    return getFullSearchMetadata(elem?.parentNode as any, i + 1);
  });

  const retval: any = {};

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
        debug('No results found: found this message: %s', retval.message);
        retval.hatespeech = !!retval?.message?.match(/hateful/);
      }
    });
  }

  return retval;
};

export default search;
