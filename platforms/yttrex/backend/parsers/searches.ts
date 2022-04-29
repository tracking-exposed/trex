import { formatDistanceToNow, subSeconds } from 'date-fns';
import D from 'debug';
import _ from 'lodash';
import { HTMLSource } from '../lib/parser/html';
import { SearchMetadata } from '../models/Metadata';
import * as longlabel from './longlabel';

const debuge = D('parser:searches:error');
const debugn = D('parser:searches:note');

function findSection(video): any {
  // go up till a ytd-shelf-renderer
  // don't go further a ytd-item-section-renderer
  let sectionName = 'Search results';
  _.reduce(
    _.times(5),
    function (memo) {
      if (memo.parentNode.tagName === _.toUpper('ytd-item-section-renderer'))
        return memo;
      memo = memo.parentNode;
      const h2 = memo.firstElementChild.querySelector('h2');
      if (h2) {
        // check any form of consistency
        if (h2.querySelector('.ytd-shelf-renderer'))
          sectionName = h2.textContent;
      }
      return memo;
    },
    video
  );
  return sectionName;
}

function dissectVideoAndParents(video, i: number): any {
  // <ytd-video-renderer> element
  const position = i + 1;
  const thuhref = video.querySelector('a#thumbnail');
  const href = thuhref.getAttribute('href');

  const urlo = _.startsWith(href, 'http')
    ? new URL(href)
    : new URL('https://www.youtube.com' + href);

  const linkedInfo = {
    videoId: urlo.searchParams.get('v'),
    offset: {},
  };

  if (href.length !== 20) {
    const tParam = urlo.searchParams.get('t');
    if (tParam?.length) linkedInfo.offset = tParam;
    else debuge('this params is not a time offset? %s', href);
  }

  const authorInfo = _.reduce(
    video.querySelectorAll('a'),
    function (memo, aele) {
      const linkto = aele.getAttribute('href');
      if (!linkto || !linkto.length || !aele.textContent.length) return memo;
      if (
        linkto.match(/^\/channel\//) ||
        linkto.match(/^\/user\//) ||
        linkto.match(/^\/c\//)
      ) {
        memo.authorName = aele.textContent;
        memo.authorSource = linkto;
      }
      return memo;
    },
    {
      authorName: null,
      authorSource: null,
    }
  );

  /* if(!authorInfo.authorName) debugger; */

  const title = video.querySelector('[title]').getAttribute('title');
  const arialabel = video
    .querySelector('h3')
    .querySelector('[aria-label]')
    .getAttribute('aria-label');

  const isLive = !!video.querySelector('.badge-style-type-live-now');

  try {
    const arinfo = longlabel.parser(arialabel, authorInfo.authorName, isLive);
    const sectionName = findSection(video);

    // debug("%d %s", position, sectionName);
    return {
      position,
      title,
      ...authorInfo,
      sectionName,
      href,
      ...linkedInfo,
      views: arinfo.views,
      arialabel,
      isLive,
      order: i,
      published: arinfo.timeago
        ? formatDistanceToNow(
            subSeconds(new Date(), arinfo.timeago.asSeconds()),
            {
              includeSeconds: false,
            }
          ).replace(/about\s/gi, '')
        : null,
      secondsAgo: arinfo.timeago ? arinfo.timeago.asSeconds() : NaN,
    };
  } catch (error) {
    debuge('Failed video #%d: %s', i, error.message);
    return null;
  }
}

function unpackCorrection(corelem): string[] {
  if (corelem.tagName === 'YT-FORMATTED-STRING') return corelem.textContent;
  return _.compact(_.flatten(_.map(corelem.children, unpackCorrection)));
}

export function process(envelop: HTMLSource): SearchMetadata | null {
  /* this function process a page like:
    https://www.youtube.com/results?search_query=fingerprinting
       and the logic here is: look for any video, and then move above 
       until you figure if belong to a 'macrosection' ("For You", "People Also Watched")
       or not. By using ytd-video-renderer the order is attributed */

  const videos = envelop.jsdom.querySelectorAll('ytd-video-renderer');
  if (!videos.length) {
    debuge(
      "Search result of %s doesn't seem having any video!",
      (envelop.html?.nature as any)?.query
    );
    return null;
  }
  const dissected = _.map(videos, dissectVideoAndParents);
  const results = _.compact(dissected);
  if (dissected.length !== results.length) {
    if (dissected.length < results.length / 2) {
      debuge(
        'From %d potential vidoes only %d were extracted: rejecting (lang %o)',
        dissected.length,
        results.length,
        envelop.html.blang
      );
      return null;
    } else {
      debugn(
        'From %d potential vidoes only %d were extracted: keeping it! (lang %o)',
        dissected.length,
        results.length,
        envelop.html.blang
      );
    }
  }
  const correction = envelop.jsdom.querySelector('yt-search-query-correction');

  const retval: SearchMetadata = {
    ...(envelop.html.nature as any),
    href: envelop.html.href,
    clientTime: envelop.html.clientTime,
    blang: envelop.html.blang,
    results,
    correction: [],
  };
  /* this is the only optional field, and might have two or four elements in the list */
  if (correction) retval.correction = unpackCorrection(correction);

  return retval;
}
export default process;

/*
    const queries = _.map(_.groupBy(effective, 'metadataId'), function(pelist, metadataId) {
        return {
            id: metadataId,
            searchTerms: _.first(pelist).searchTerms,
            savingTime: _.first(pelist).savingTime,
            clang: _.first(pelist).clang,
            publicKey: _.first(pelist).publicKey,
            results: _.size(pelist),
        }
    });
    const queriesWritten = await automo.upsertSearchResults(queries, nconf.get('schema').queries);
    const unCheckedRetVal = await automo.upsertSearchResults(effective, nconf.get('schema').searches);
    if(queriesWritten || unCheckedRetVal)
        debug("Saved %d query and %d search results", queriesWritten, unCheckedRetVal);
 */
