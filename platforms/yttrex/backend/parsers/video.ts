import { trexLogger } from '@shared/logger';
import { parseISO } from 'date-fns';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import _ from 'lodash';
import moment from 'moment';
import { HTMLSource } from '../lib/parser/html';
import utils from '../lib/utils'; // this because parseLikes is an utils to be used also with version of the DB without the converted like. but should be a parsing related-only library once the issue with DB version is solved
import { ParsedInfo, VideoMetadata } from '@yttrex/shared/models/Metadata';
import * as longlabel from './longlabel';
import * as shared from './shared';
import uxlang from './uxlang';
import { ParserFn } from '@shared/providers/parser.provider';
import { YTParserConfig } from './config';

const videoLog = trexLogger.extend('video');

export const VideoProcessResult = t.strict(
  {
    title: t.string,
    type: t.literal('video'),
    params: t.any,
    videoId: t.string,
    login: t.union([t.boolean, t.null]),
    publicationString: t.string,
    publicationTime: date,
    blang: t.string,
    related: t.array(t.any),
    viewInfo: t.any,
    likeInfo: t.any,
  },
  'VideoProcessResult'
);

export type VideoProcessResult = t.TypeOf<typeof VideoProcessResult>;

const stats = { skipped: 0, error: 0, suberror: 0, success: 0 };

interface Views {
  viewStr: string | undefined;
  viewNumber: number;
}

function parseViews(D: Document): Views {
  const node = _.first(D.getElementsByClassName('view-count'));
  const viewStr = node?.innerHTML;
  const tmp = _.first(viewStr?.split(' '));
  const viewNumber = _.parseInt(tmp?.replace(/[.,]/g, '') ?? '');
  const views = { viewStr, viewNumber };
  videoLog.debug('Views: %O', views);
  return views;
}

interface Likes {
  likes: string;
  dislikes: string;
}

function parseLikes(D: Document): Likes {
  const nodes = D.querySelectorAll(
    '.ytd-toggle-button-renderer > yt-formatted-string'
  );
  const likes = nodes[0].getAttribute('aria-label');
  const dislikes = nodes[1].getAttribute('aria-label');
  const likeInfo = { likes: likes ?? '', dislikes: dislikes ?? '' };
  videoLog.debug('Like info: %O', likeInfo);
  return likeInfo;
}

export function closestForTime(
  e,
  sele
): { displayTime: string | null; expandedTime: string | null } {
  /* this function is a kind of .closest but apply to textContent and aria-label
       to find the right element */

  /* debug("(e) %j\n<- %j",
        _.map ( e.querySelectorAll('[href]'), function(x) { return x.getAttribute('href') }),
        _.map ( e.querySelectorAll('*'), 'textContent')
    ); */
  const combo = _.compact(
    _.map(e.querySelectorAll('[aria-label]'), function (x) {
      const label = x.getAttribute('aria-label');
      const text = x.textContent;
      /* label[0] == text[0] can't work because of "40 секунд" fails with "0:40"  */
      return !!label.match(/^(\d+).*/) && !!text.match(/^(\d+):(\d+).*/)
        ? { label, text }
        : null;
    })
  );

  const match = _.first(combo);
  if (match) {
    const expandedTime = match.label.trim(); // '3:02'
    const displayTime = match.text.trim(); // '3 minutes, 2 seconds'
    return { displayTime, expandedTime };
  }

  if (_.size(e.parentNode.outerHTML) > 9000) {
    // debugTimef("[display/extended Time] breaking recursion, next would be %d bytes", _.size(e.parentNode.outerHTML));
    return { displayTime: null, expandedTime: null };
  }

  // debugTimef("[display/extended Time] recursion (%d next %d)", _.size(e.outerHTML), _.size(e.parentNode.outerHTML) );
  return closestForTime(e.parentNode, null);
}

export function checkUpDebug(r): void {
  const liveSpecialFields = [
    'displayTime',
    'expandedTime',
    'recommendedLength',
  ];
  /* this is a friendly debug line to help summarize */
  const first = _.reduce(
    r,
    function (memo, v, k) {
      if (_.isNull(v)) {
        memo.acc.push(k);
        if (liveSpecialFields.includes(k)) memo.livecombo++;
        memo.cnt++;
      }
      if (_.isNull(v)) _.unset(r, k);

      return memo;
    },
    { acc: [] as string[], cnt: 0, livecombo: 0 }
  );

  let second: any;
  if (_.size(first.acc) >= 3 && first.livecombo === 3) {
    second = _.reject(first.acc, liveSpecialFields);
  } else second = first.acc;

  const debstr =
    _.times(second, function (k) {
      return '!' + k;
    }).join('') + '';

  if (_.size(debstr)) videoLog.debug('%s\n\t%d\t%s', debstr, r.index, r.label);
}

function relatedMetadata(e: any, i: number): ParsedInfo | null {
  // videoLog.debug('tagName %O at index %d', e.tagName, i);
  // here we find metadata inside the preview snippet on the right column
  let foryou, mined;
  const title = e.querySelector('#video-title').textContent;
  const metadata = e.querySelector('#metadata');

  const verified = !!metadata.querySelector('svg');
  const source = metadata.querySelector('yt-formatted-string').textContent;

  const link = e.querySelector('a')
    ? e.querySelector('a').getAttribute('href')
    : null;
  // eslint-disable-next-line node/no-deprecated-api
  const urlinfo = link ? new URL(`https://www.youtube.com${link}`) : undefined;
  const params = {};
  const videoId = urlinfo?.searchParams?.get('v');

  urlinfo?.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const liveBadge = !!e.querySelector('.badge-style-type-live-now');
  const thumbnailHref = shared.getThumbNailHref(e);

  const { displayTime, expandedTime } = closestForTime(
    e,
    '.ytd-thumbnail-overlay-time-status-renderer'
  );
  // 2:03  -  2 minutes and 3 seconds, they might be null.
  const recommendedLength = displayTime
    ? moment.duration(shared.fixHumanizedTime(displayTime)).asSeconds()
    : null;
  const arialabel = e.querySelector('#video-title').getAttribute('aria-label');
  // Beastie Boys - Sabotage by BeastieBoys 9 years ago 3 minutes, 2 seconds 62,992,821 views

  if (!arialabel) return null;

  try {
    mined = arialabel ? longlabel.parser(arialabel, source, liveBadge) : null;
    if (mined.title !== title) {
      videoLog.debug('Interesting anomaly: %s != %s', mined.title, title);
    }
  } catch (e) {
    videoLog.error('longlabel parser error: %s', e.message);
  }

  /* estimate live also by missing metadata but presence of certain few */
  const estimatedLive = (function () {
    if (mined?.isLive) return true;
    return !!(!displayTime && !expandedTime && !recommendedLength);
  })();

  const recommendedRelativeSeconds = estimatedLive
    ? null
    : mined
    ? mined.timeago.asSeconds()
    : null;

  const r = {
    index: i + 1,
    verified,
    foryou,
    videoId,
    params,
    recommendedSource: source,
    recommendedTitle: mined ? mined.title : title || null,
    recommendedLength,
    recommendedDisplayL: displayTime ?? null,
    recommendedLengthText: expandedTime ?? null,
    recommendedPubTime: estimatedLive ? null : mined ? mined.timeago : null,
    /* ^^^^  is deleted in makeAbsolutePublicationTime, when clientTime is available,
     * this field produces -> recommendedPubtime and ptPrecison */
    recommendedRelativeSeconds,
    recommendedViews: mined ? mined.views : null,
    recommendedThumbnail: thumbnailHref,
    isLive: estimatedLive || liveBadge,
    label: arialabel,
  };
  checkUpDebug(r);
  return r as any;
}

export interface VideoResultAbsolutePubTime
  extends Omit<ParsedInfo, 'recommendedPubTime'> {
  publicationTime: Date | null;
  timePrecision: string;
}

export function makeAbsolutePublicationTime(
  list: Array<Omit<ParsedInfo, 'publicationTime' | 'timePrecision'>>,
  clientTime: Date
): VideoResultAbsolutePubTime[] {
  /* this function is call before video.js and home.js return their 
       metadata. clientTime isn't visibile in parsing function so the relative
       transformation of '1 month ago', is now a moment.duration() object 
       and now is saved the estimated ISODate format. */
  return _.map(
    list,
    function ({ recommendedPubTime, ...r }, i): VideoResultAbsolutePubTime {
      if (!clientTime || !recommendedPubTime) {
        return {
          ...r,
          publicationTime: null,
          timePrecision: 'error',
        };
      } else {
        const when = moment(clientTime).subtract(recommendedPubTime);

        return {
          ...r,
          publicationTime: parseISO(when.toISOString()),
          timePrecision: 'estimated',
        };
      }
      /* we are keeping 'label' so it can be fetch in mongodb but filtered in JSON/CSV */
      // return r;
    }
  );
}

export function parseSingleTry(D: Document, memo: any, spec: any): any {
  const elems = D?.querySelectorAll(spec.selector) ?? [];

  if (!_.size(elems)) {
    // debuge("zero element selected: %s fail", spec.name);
    return memo;
  }

  const source: any = spec.selected
    ? _.nth(elems, spec.selected)
    : _.first(elems);

  try {
    const candidate = source[spec.func];
    if (_.size(candidate)) {
      if (memo) {
        // debug("Not replacing [%s] with [%s] by %s", memo, candidate, spec.name);
        return memo;
      }
      return candidate;
    }
  } catch (error) {
    return memo;
  }
}

function manyTries(D: Document, opportunities): any {
  const r = _.reduce(opportunities, _.partial(parseSingleTry, D), null);
  videoLog.debug('manyTries: %j: %s', _.map(opportunities, 'name'), r);
  return r;
}

interface AuthorInfo {
  forKids: boolean;
  authorName?: string;
  authorSource?: string;
}

export function mineAuthorInfo(D: Document): AuthorInfo | null {
  const as = D.querySelector(
    'a.ytd-video-owner-renderer'
  )?.parentNode?.querySelectorAll('a');
  if (_.size(as) === 1 || _.size(as) === 0) return null;

  const authorName = D.querySelector(
    'a.ytd-video-owner-renderer'
  )?.parentNode?.querySelectorAll('a')[1].textContent;
  const authorSource = D.querySelector('a.ytd-video-owner-renderer')
    ?.parentNode?.querySelectorAll('a')[0]
    ?.getAttribute('href');
  const forKids = !!D.querySelector('a[href="https://www.youtubekids.com/"]');

  if (
    D.querySelector('a.ytd-video-owner-renderer')
      ?.parentNode?.querySelectorAll('a')[1]
      ?.getAttribute('href') !== authorSource
  ) {
    videoLog.debug(
      '%s and %s should lead to the same youtube-content-page',
      D.querySelector('a.ytd-video-owner-renderer')
        ?.parentNode?.querySelectorAll('a')[1]
        ?.getAttribute('href'),
      authorSource
    );
  }
  return {
    forKids,
    authorName: authorName ?? undefined,
    authorSource: authorSource ?? undefined,
  };
}

export function simpleTitlePicker(D: Document): string | null {
  const title = _.reduce(
    D.querySelectorAll('h1'),
    function (memo, ne) {
      if (memo) return memo;
      if (ne.textContent?.length) memo = ne.textContent;
      return memo;
    },
    null as string | null
  );

  if (title) {
    return title;
  }

  const videoLabel =
    D.querySelector('#video-title')?.getAttribute('aria-label');

  if (videoLabel) {
    const titleFromAriaLabel = longlabel.parser(videoLabel, '', false);
    videoLog.debug('Title from aria label %s', titleFromAriaLabel);
    return titleFromAriaLabel.title ?? null;
  }

  return null;
}

export function processVideo(
  D: Document,
  blang: string,
  clientTime: Date,
  urlinfo?: URL
): VideoMetadata {
  /* this method to extract title was a nice experiment
   * and/but should be refactored and upgraded */
  let title = manyTries(D, [
    {
      name: 'title h1',
      selector: 'h1 > yt-formatted-string',
      expected: null,
      selected: null,
      func: 'textContent',
    },
    {
      name: 'title ytp-title',
      selector: '.ytp-title',
      expected: null,
      selected: null,
      func: 'textContent',
    },
  ]);

  if (!title) title = simpleTitlePicker(D);

  if (!title) {
    throw new Error('unable to get video title');
  }

  /*
    const check = D
        .querySelectorAll('ytd-channel-name.ytd-video-owner-renderer')
        .length;
    if(check != 2)
        debuge("unexpected condition in channel/author mining, should be 2, is %d", check);
    */

  const authorinfo = mineAuthorInfo(D);
  if (!authorinfo) throw new Error('lack of mandatory HTML snippet!');

  const { publicationTime, publicationString, ifLang } =
    uxlang.sequenceForPublicationTime(D, blang, clientTime);

  let related: any[] = [];
  try {
    // debug("related videos to be looked at: %d", _.size(D.querySelectorAll('ytd-compact-video-renderer')));
    related = _.map(
      D.querySelectorAll('ytd-compact-video-renderer'),
      relatedMetadata
    );
  } catch (error) {
    throw new Error(
      `Unable to mine related: ${error.message}, ${error.stack.substr(
        0,
        220
      )}...`
    );
  }

  videoLog.debug(
    'Video <%s> has %d recommended (found %d, live %j)',
    title,
    _.size(related),
    _.size(_.compact(related)),
    _.countBy(related, 'isLive')
  );
  related = makeAbsolutePublicationTime(_.compact(related), clientTime);

  /* non mandatory info */
  let viewInfo;
  let likeInfo: {
    watchedLikes: number | null;
    watchedDislikes: number | null;
  } = {
    watchedLikes: null,
    watchedDislikes: null,
  };
  try {
    viewInfo = parseViews(D);
    const likes = parseLikes(D);
    const numeredInteractions = utils.parseLikes(likes);
    likeInfo = {
      watchedLikes: numeredInteractions.watchedLikes,
      watchedDislikes: numeredInteractions.watchedDislikes,
    };
  } catch (error) {
    videoLog.error('viewInfo and linkInfo not available: %O', error);
  }

  let login: boolean | null = null;
  try {
    login = shared.logged(D);
    /* if login is null, it means failed check */
  } catch (error) {
    videoLog.error('Failure in logged(): %s', error.message);
  }

  const params = {};
  urlinfo?.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const videoId = urlinfo?.searchParams.get('v');

  return {
    title,
    type: 'video',
    nature: { type: 'video' },
    params,
    videoId,
    login,
    publicationString,
    publicationTime,
    blang: blang || ifLang,
    ...authorinfo,
    related,
    viewInfo,
    likeInfo,
  } as any;
}

const parseVideo: ParserFn<HTMLSource, VideoMetadata, YTParserConfig> = async (
  envelop
) => {
  let extracted: VideoMetadata;

  try {
    extracted = processVideo(
      envelop.jsdom,
      envelop.html?.blang,
      envelop.html?.clientTime,
      // eslint-disable-next-line node/no-deprecated-api
      new URL(envelop.html?.href ?? '')
    );
  } catch (e) {
    videoLog.error(
      'Error in video.process %s (%j): %s\n\t-> %s',
      envelop.html?.href ?? '',
      envelop.html?.nature,
      e.message,
      e.stack.split('\n')[1]
    );
    return null;
  }

  const re = _.filter(extracted.related, { error: true });
  stats.suberror += _.size(re);
  const ve = _.filter(extracted.viewInfo, { error: true } as any);
  stats.suberror += _.size(ve);
  const le = _.filter(extracted.likeInfo, { error: true } as any);
  stats.suberror += _.size(le);

  if (_.size(re))
    videoLog.debug('related error %s', JSON.stringify(re, undefined));
  if (_.size(ve))
    videoLog.debug('views error %s', JSON.stringify(ve, undefined));
  if (_.size(le))
    videoLog.debug('likes error %s', JSON.stringify(re, undefined));
  return extracted;
};

export default parseVideo;
