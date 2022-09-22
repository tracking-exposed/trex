import { ParserFn } from '@shared/providers/parser.provider';
import { Ad } from '../../models/Ad';
import { Leaf } from '../../models/Leaf';
import { leafSelectors } from '../selectors';
import D from 'debug';
import { LeafSource } from '../source';
import _ from 'lodash';
import moment from 'moment';
import { YTParserConfig } from '../config';

const leafLogger = D('leaf');
const leafLogD = leafLogger.extend('debug');
const leafLogE = leafLogger.extend('error');

interface BaseAd {
  sponsoredSite: string;
  sponsoredName: string;
  adseconds: number;
}

function mineAd(D: Document, e: Leaf): BaseAd {
  const sponsoredSite = D.querySelector('.ytp-ad-button-text')
    ?.textContent as any;
  const remaining = D.querySelector('.ytp-ad-duration-remaining')
    ?.textContent as any;
  const fixed = remaining.length > 6 ? remaining : '00:' + remaining;
  const adseconds = moment.duration(fixed)?.asSeconds();
  return {
    sponsoredName: 'TODO',
    sponsoredSite,
    adseconds,
  };
}

function mineOverlay(D: Document, e: Leaf): Pick<BaseAd, 'sponsoredSite'> {
  const buttons = D.querySelectorAll('.ytp-ad-button-link');
  const sponsoredSite = _.reduce(
    buttons,
    function (memo, b) {
      if (memo) return memo;
      if (b?.textContent?.length) return b.textContent;
    },
    null
  ) as any as string;
  return { sponsoredSite };
}

function mineTRP(D: Document, e: Leaf): Partial<BaseAd> | null {
  const header = D.querySelector('#header');
  const domain = D.querySelector('#domain');
  if (!header && !domain) return null;
  const retval: Partial<BaseAd> = {
    sponsoredName: undefined,
    sponsoredSite: undefined,
  };
  if (header) retval.sponsoredName = header.textContent?.trim();
  if (domain) retval.sponsoredSite = domain.textContent?.trim();
  return retval;
}

function mineAdBadge(D: Document, e: Leaf): Partial<BaseAd> | null {
  const h3 = D.querySelector('h3');
  const wt = D.querySelector('#website-text');
  // one of the two conditions
  const header = D.querySelector('#header');
  const domain = D.querySelector('#domain');

  if (wt && h3)
    return {
      sponsoredName: h3.textContent?.trim(),
      sponsoredSite: wt.textContent?.trim(),
    };
  else if (header && domain)
    return {
      sponsoredName: header.textContent?.trim(),
      sponsoredSite: domain.textContent?.trim(),
    };
  else return null;
}

function mineChannel(D: Document, e: LeafSource): any {
  const a = D.querySelector('a');
  const channelLink = a?.getAttribute('href');
  const ct = D.querySelector('#text');
  const channelName = ct ? ct.textContent?.trim() : a?.textContent?.trim();

  // console.log({ channelName, channelLink });
  leafLogD('channel name %s with link (%s)', channelName, channelLink);
  if (channelName && channelLink?.split('/')[1] === 'channel') {
    return {
      channelName,
      channelId: channelLink.split('/')[2],
    };
  }

  if (channelName && channelLink?.startsWith('/c/')) {
    return {
      channelName,
      channelId: channelLink,
    };
  }
}

function mineBanner(D: Document, e: Leaf): any {
  /* exclude the 'Ads in 2' label, among others */
  if (e.html.length < 350) return null;

  const imgs = D.querySelectorAll('img');
  if (imgs.length === 0) {
    const errorretval = {
      error: true,
      reason: 1,
      images: imgs.length,
      wouldebug: e.html.length > 6000,
      htmlsize: e.html.length,
      texts: D.querySelector('div')?.textContent,
    };
    leafLogE('mineBanner error: %O', errorretval);
    if (e.html.length > 6000) {
      leafLogD('DEBUG HERE!');
    }
    return errorretval;
  }

  const spans = D.querySelectorAll('span');
  if (!spans.length) {
    const errorretval = {
      error: true,
      reason: 2,
      wouldebug: e.html.length > 2000,
      htmlsize: e.html.length,
      texts: D.querySelector('div')?.textContent,
    };
    leafLogE('mineBanner error: %O', errorretval);
    if (e.html.length > 2000) {
      leafLogD('DEBUG HERE!');
    }
    return errorretval;
  }

  /* pick the first span with a value */
  const buyer = _.reduce(
    spans,
    function (memo, span) {
      if (memo) return memo;
      if ((span?.textContent?.length ?? 0) > 0) memo = span.textContent as any;
      return memo;
    },
    null
  );

  const retval = { buyer };
  if (imgs.length === 1) {
    const videot = imgs[0].getAttribute('src');
    if (!_.endsWith(videot ?? '', 'mqdefault.jpg'))
      leafLogE('Unexpected condition! %s', videot);

    return {
      ...retval,
      videot,
    };
  }
  /* else */
  return {
    buyeri: imgs[0].getAttribute('src'),
    videot: imgs[1].getAttribute('src'),
    ...retval,
  };
}

export const allowedSelectors = Object.keys(leafSelectors).filter(
  (sel) => !['channel1'].includes(sel)
);
// [
//   'banner',
//   'ad',
//   'overlay',
//   'toprightad',
//   'toprightpict',
//   'toprightcta',
//   'toprightattr',
//   'adbadge',
//   'channel',
//   'searchcard',
//   'channellink',
//   'searchAds',
// ];

export const processLeaf: ParserFn<LeafSource, Ad, YTParserConfig> = async (
  e,
  prev
) => {
  // e is the 'element', it comes from the DB, and we'll look the
  // e.html mostly. different e.selecotrName causes different sub-functions
  if (!allowedSelectors.includes(e.html.selectorName)) {
    leafLogD(
      'Invalid/Unexpected selector %s received: %s, (keys \n %O)',
      e.html.selectorName,
      e.html.metadataId,
      allowedSelectors
    );
    return null;
  }

  // leafLogD('Process leaf %O', e);

  let mined: any = null;
  try {
    const D = e.jsdom;
    // eslint-disable-next-line no-console
    // console.log(e.nature, e.selectorName);

    leafLogD('selector %s', e.html.selectorName);

    if (e.html.selectorName === 'ad') mined = mineAd(D, e.html);
    else if (e.html.selectorName === 'banner') mined = mineBanner(D, e.html);
    else if (e.html.selectorName === 'overlay') mined = mineOverlay(D, e.html);
    else if (e.html.selectorName === 'toprightpict') mined = mineTRP(D, e.html);
    /* channel is temporarly disabled */ else if (
      e.html.selectorName === 'channel' ||
      e.html.selectorName === 'channel1' ||
      e.html.selectorName === 'channel2' ||
      e.html.selectorName === 'channel3'
    )
      mined = mineChannel(D, e);
    else if (e.html.selectorName === 'adbadge') mined = mineAdBadge(D, e.html);
    else leafLogger('Selector not handled %s', e.html.selectorName);

    // eslint-disable-next-line no-console
    leafLogD('Mined %O', mined);
  } catch (error) {
    leafLogger(
      'Error in content mining (%s %s): %s',
      e.html.selectorName,
      e.html.metadataId,
      error.message
    );
    return null;
  }

  if (_.isNull(mined)) return null;

  const { nature, ...retval } = _.pick(e.html, [
    'nature',
    'selectorName',
    'channelName',
    'channelLink',
    'offsetTop',
    'offsetLeft',
    'href',
    'metadataId',
    'id',
    'savingTime',
    'publicKey',
  ]);

  /* this happens here because this is *the code loop*
         where ADs is processed, and should be redoundant 
         if exist any other place that is a parser-provider ---
      -- experiment support, if there is an object with that 
      name saved from the input (routes/events) make a copy.
      Remind: the experiments are ephemerals (18 hours TTL)      */
  if (e.html.experiment) (retval as any).experiment = e.html.experiment;

  const result = {
    ...prev,
    ...nature,
    nature,
    ...retval,
    ...mined,
  };
  // leafLogD('leaf result %O', result);
  return result;
};
