import { trexLogger } from '@shared/logger';
import _ from 'lodash';
import moment from 'moment';
import { HTMLSource } from '../lib/parser/html';
import { HomeMetadata, ParsedInfo } from '@yttrex/shared/models/Metadata';
import * as longlabel from './longlabel';
import * as shared from './shared';
import uxlang from './uxlang';
import * as videoparser from './video';

const homeLog = trexLogger.extend('home');

function dissectSelectedVideo(
  ee: Element,
  i: number,
  sections: any[],
  offset: number | undefined,
  clientTime: Date
): Omit<ParsedInfo, 'timePrecision' | 'thumbnailHref'> | null {
  const infos = {
    link: undefined,
    videoId: undefined,
    source: undefined,
    verified: false,
    textTitle: undefined,
    href: undefined,
    authorName: undefined,
    authorSource: undefined,
    authorHref: undefined,
    error: false,
    expandedTime: null,
    displayTime: null,
    recommendedLength: 0,
    thumbnailHref: null,
    parameter: null,
    liveBadge: false,
    aria: null,
  };
  const errorLog: string[] = [];

  // to keep the previous behaviour we cast the element to any
  const e = ee as any;

  try {
    infos.textTitle = e.querySelector('#video-title-link').textContent;
  } catch (error) {
    errorLog.push('Failure in textTitle: ' + error.message);
    infos.error = true;
  }
  try {
    infos.href = e.querySelector('a').getAttribute('href');
  } catch (error) {
    errorLog.push('Failure in href: ' + error.message);
    infos.error = true;
  }
  try {
    infos.authorName = e
      .querySelector('#text-container.ytd-channel-name')
      .querySelector('a').textContent;
  } catch (error) {
    errorLog.push('Failure in authorName: ' + error.message);
    infos.error = true;
  }

  try {
    infos.authorHref = e
      .querySelector('#text-container.ytd-channel-name')
      .querySelector('a')
      .getAttribute('href');
  } catch (error) {
    errorLog.push('Failure in authorHref: ' + error.message);
    infos.error = true;
  }
  try {
    const metadata = e.querySelector('#metadata');
    if (metadata.children.length > 0) {
      // if is verified, the keyword vary language by language, but you've always
      // TED\nVerified\n•, and this allow us a more technical check:
      infos.source = _.first(metadata.children[0].textContent.split('\n'));
      infos.verified = !!(
        _.size(metadata.children[0].textContent.split('\n')) > 1
      );
      if (
        infos.source &&
        infos.authorName &&
        infos.source !== infos.authorName
      ) {
        // debugw("To be investigated anomaly n.1 [%s]!=[%s]", infos.source, infos.authorName);
        // this is interesting but .source isn't used and it is the one appearing duplicated
      }
    }
  } catch (error) {
    errorLog.push('Failure in source/verified: ' + error.message);
    infos.error = true;
  }
  try {
    const { displayTime, expandedTime } = videoparser.closestForTime(
      e,
      '.ytd-thumbnail-overlay-time-status-renderer'
    );

    infos.displayTime = displayTime as any;
    infos.expandedTime = expandedTime as any;
    infos.recommendedLength = displayTime
      ? moment.duration(shared.fixHumanizedTime(displayTime)).asSeconds()
      : -1;
  } catch (error) {
    errorLog.push('Failure in displayTime|expandedTime: ' + error.message);
    infos.error = true;
  }

  try {
    const link = e.querySelector('a')
      ? e.querySelector('a').getAttribute('href')
      : null;
    infos.videoId = link?.replace(/.*v=/, '');
    infos.parameter = (infos.videoId as any)?.match(/&.*/)
      ? (infos.videoId as any).replace(/.*&/, '&')
      : null;

    infos.liveBadge = !!e.querySelector('.badge-style-type-live-now');
  } catch (e) {
    errorLog.push(`simple metadata parser error: ${e.message}`);
  }

  let videoTileLinkParsed;
  try {
    infos.aria = e
      .querySelector('#video-title-link')
      .getAttribute('aria-label');

    videoTileLinkParsed = infos.aria
      ? longlabel.parser(infos.aria, infos.authorName as any, infos.liveBadge)
      : null;

    homeLog.debug('Video title parsed %O', {
      ...videoTileLinkParsed,
      timeago: videoTileLinkParsed?.timeago?.toString(),
    });

    if (
      videoTileLinkParsed?.title &&
      infos.textTitle &&
      videoTileLinkParsed.title !== infos.textTitle
    )
      homeLog.warn(
        'To be investigated anomaly n.2 [%s]!=[%s]',
        videoTileLinkParsed.title,
        infos.textTitle
      );
  } catch (e) {
    const aria = infos.aria ? infos.aria : '[aria-label-not-avail]';

    errorLog.push(`longlabel parser error: ${aria} ${e.message} `);
  }

  let section: string | null = null;

  try {
    const sectionNumber = _.size(
      _.filter(_.map(sections, 'offset'), function (o) {
        return _.gt(o, offset);
      })
    );
    section = _.get(sections, sectionNumber, { title: null }).title;
  } catch (e) {
    errorLog.push(
      'Section calculation fail: ' +
        JSON.stringify(sections) +
        'offset' +
        offset
    );
  }

  if (errorLog.length > 0) {
    homeLog.error(
      'Video order %d got %d errors [elemSize %d]: %j',
      i,
      errorLog.length,
      e.outerHTML.length,
      errorLog
    );
  }

  if (!infos.aria) return null;

  // const recommendedRelativeSeconds = videoTileLinkParsed?.timeago
  //   ? differenceInSeconds(videoTileLinkParsed.timeago, clientTime) > 0
  //     ? differenceInSeconds(videoTileLinkParsed.timeago, clientTime)
  //     : differenceInSeconds(clientTime, videoTileLinkParsed.timeago)
  //   : null;

  // homeLog.debug('relative seconds %O', videoTileLinkParsed);

  const s = {
    index: i + 1,
    verified: infos.verified,
    videoId: infos.videoId as any,
    parameter: infos.parameter ? infos.parameter : null,
    sectionName: section,
    recommendedSource: infos.authorName ? infos.authorName : null,
    recommendedHref: infos.authorHref ? infos.authorHref : null,
    recommendedTitle: videoTileLinkParsed ? videoTileLinkParsed.title : null,
    recommendedLength: infos.recommendedLength,
    recommendedDisplayL: infos.displayTime ? infos.displayTime : null,
    recommendedLengthText: infos.expandedTime ? infos.expandedTime : null,
    recommendedPubTime: videoTileLinkParsed?.timeago
      ? videoTileLinkParsed.timeago
      : null,
    /* ^^^^  is deleted in makeAbsolutePublicationTime, when clientTime is available,
     * this field produces -> recommendedPubtime and ptPrecison */
    recommendedRelativeSeconds: videoTileLinkParsed?.timeago
      ? videoTileLinkParsed.timeago.asSeconds()
      : null,
    recommendedViews: videoTileLinkParsed ? videoTileLinkParsed.views : null,
    isLive: !!infos.liveBadge,
    label: infos.aria ? infos.aria : null,
    elems: _.size(e.outerHTML),
  };
  videoparser.checkUpDebug(s);

  return s;
}

/* Size tree special debug method. This is quite CPU intensive therefore should be
 * enabled only by explicitly patching the variable below */
const RECURSIZE_SIZE_ENABLED = false;
function recursiveSize(e: any, memo?: any): any {
  if (!RECURSIZE_SIZE_ENABLED) {
    // eslint-disable-next-line
    console.log("function shouldn't be invoked");
    return null;
  }
  const elementSize = _.size(e.outerHTML);
  const tagName = e.tagName;
  if (!tagName) return memo;
  const combo = elementSize + ''; // + '-' + tagName.substring(0, 5);
  if (!memo) return recursiveSize(e.parentNode, [combo]);
  memo.push(combo);
  return recursiveSize(e.parentNode, memo);
}
let sizes: any[] = [];
function sizeTreeResearch(e, i): void {
  if (!RECURSIZE_SIZE_ENABLED) return;
  if (!i) sizes = [];
  sizes.push(recursiveSize(e));
}
function debugSizes(selected): void {
  if (!RECURSIZE_SIZE_ENABLED) return;
  _.each(sizes, function (s, i) {
    const info = _.get(selected, i);
    if (info.error)
      homeLog.warn(
        '%d %s\t[e] %s <%s>',
        info.index,
        JSON.stringify(s),
        info.reason,
        info.label
      );
    else
      homeLog.warn(
        '%d %s\t%s',
        info.index,
        JSON.stringify(s),
        info.recommendedTitle
      );
  });
}
/* ********* end of 'size' related code ********* */

interface HomeProcess {
  selected: HomeMetadata['selected'];
  sections: HomeMetadata['sections'];
}

function actualHomeProcess(D: Document, clientTime: Date): HomeProcess {
  /* selection findings */
  const sectionsWithTitle = _.compact(
    _.map(D.querySelectorAll('#title'), function (e) {
      if (!_.size(e.textContent) || !_.size(_.trim(e.textContent ?? undefined)))
        return null;

      const splits = D.querySelector('body')?.outerHTML.split(e.outerHTML);
      return {
        offset: _.size(_.first(splits)),
        splits: _.size(splits),
        title: _.first(e.textContent?.split('\n')),
      };
    })
  );

  homeLog.debug('sections %j', sectionsWithTitle);

  const videoElemSelector = 'ytd-rich-item-renderer';
  const ve = D.querySelectorAll(videoElemSelector);

  homeLog.debug("From this homepage we'll process %d video entry", _.size(ve));
  const sections: Array<{ i: number; offset: any }> = [];
  /* this collection is only useful to study the page, and it is saved in the DB */
  const selected = _.map(ve, function (e, i) {
    /* this research is interesting but not yet used */
    sizeTreeResearch(e, i);

    const thumbnailHref = shared.getThumbNailHref(e);

    try {
      const ubication = D.querySelector('body')?.outerHTML.indexOf(e.outerHTML);
      sections.push({ i, offset: ubication });
      homeLog.debug('Section %s', i, thumbnailHref);
      const videoInfo = dissectSelectedVideo(
        e,
        i,
        sectionsWithTitle,
        ubication,
        clientTime
      );
      if (videoInfo) {
        (videoInfo as any).thumbnailHref = thumbnailHref;
        return videoInfo;
      }
      throw new Error('No video Info');
    } catch (error) {
      homeLog.debug('Error during video dissect %O', error);
      const f = e.querySelector('#video-title-link');
      const s = f ? f.getAttribute('aria-label') : null;
      return {
        index: i + 1,
        error: true,
        reason: error.message,
        label: s,
        thumbnailHref,
      };
    }
  });
  const effective = _.reject(selected, { error: true });
  homeLog.info(
    'Parsing completed. Analyzed %d, effective %d, sections %d',
    selected.length,
    effective.length,
    sections.length
  );
  debugSizes(effective);
  return { selected: effective as any[], sections };
  /* sections would be removed before being saved in mongodb */
}

function guessUXLanguage(D: Document): string | null {
  const buttons = D.querySelectorAll('button');
  const localizedStrings = _.compact(
    _.map(buttons, function (e) {
      return e.textContent?.trim();
    })
  );
  /* note, home and video seems to share the same pattern */
  return uxlang.findLanguage('video', localizedStrings);
}

export function process(envelop: HTMLSource): Omit<HomeMetadata, 'id'> | null {
  const retval: Omit<HomeMetadata, 'id'> = {
    type: 'home',
    clientTime: envelop.html.clientTime,
    selected: [],
    sections: [],
    blang: null,
    login: false,
    publicKey: envelop.html.publicKey,
    href: envelop.html.href,
    savingTime: new Date(),
  };

  try {
    const { selected, sections } = actualHomeProcess(
      envelop.jsdom,
      envelop.html.clientTime
    );
    retval.selected = selected;
    retval.sections = sections;
  } catch (e) {
    homeLog.error('Error in processing %s: %s', envelop.html.href, e.message);
    return null;
  }

  retval.type = 'home';
  retval.blang = guessUXLanguage(envelop.jsdom) ?? null;

  try {
    retval.login = shared.logged(envelop.jsdom);
    /* if login is null, it means failed check */
  } catch (error) {
    homeLog.error('Exception in logged(): %s', error.message);
    retval.login = null;
  }

  try {
    retval.selected = videoparser.makeAbsolutePublicationTime(
      retval.selected,
      envelop.html.clientTime
    ) as any[];
  } catch (error) {
    homeLog.error(
      "this function is executed outside because clientTime don't travel in parsing function. error: %s %s",
      error.message,
      error.stack
    );
  }

  return retval;
}

export default process;
