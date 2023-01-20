import { ParserFn } from '@shared/providers/parser';
import { throwEitherError } from '@shared/utils/fp.utils';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import _ from 'lodash';
import D from 'debug';
import { getNatureByHref } from './nature';
import { processLink } from './downloader';
import * as videoResult from './videoResult';
const debug = D('parser:search');

function getFullSearchMetadata(renod: ParentNode, order: any): any {
  const vlink = renod.querySelector('a[href^="https://www.tiktok.com/@"]');
  const vhref = vlink?.getAttribute('href');
  const vidnat = throwEitherError(getNatureByHref(vhref as any));

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

  const publishingDate = videoResult.publishingDate(img);

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
  config,
) => {

  if (previous.nature.type !== 'search') {
    return false;
  }

  debug('Parsing entry %O', previous);


  /* this piece of code return a list of videos, because
       the search selector is not per video, but per 'body' */
  const descs = envelop.jsdom.querySelectorAll('[data-e2e="search-card-desc"]');
  const results = _.map(descs, function(elem, i) {
    return elem?.parentNode
      ? getFullSearchMetadata(elem.parentNode, i + 1)
      : null;
  });

  const retval: any = { thumbnails: [] };
  // this nesting would be inherit in metadata
  for (const result of results) {
    const fildata = await processLink(result.thumbnail, 'thumbnail', config);
    retval.thumbnails.push(fildata);
  }

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
