import D from 'debug';
import { JSDOM } from 'jsdom';
import _ from 'lodash';
import moment from 'moment';
import { Ad } from '../models/Ad';
import { Leaf } from '../models/Leaf';

const leafLogger = D('leaf');
const leafLogD = leafLogger.extend('debug');
const leafLogE = leafLogger.extend('error');

interface BaseAd {
  sponsoredSite: string;
  sponsoredName: string;
  adseconds: number;
}

function mineAd(D: Document, e): BaseAd {
  const sponsoredSite = D.querySelector('.ytp-ad-button-text')
    ?.textContent as any;
  const remaining = D.querySelector('.ytp-ad-duration-remaining')
    ?.textContent as any;
  const fixed = remaining.length > 6 ? remaining : '00:' + remaining;
  const adseconds = moment.duration(fixed).asSeconds();
  return {
    sponsoredName: 'TODO',
    sponsoredSite,
    adseconds,
  };
}

function mineOverlay(D: Document, e): Pick<BaseAd, 'sponsoredSite'> {
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

function mineTRP(D: Document, e: any): Partial<BaseAd> | null {
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

function mineAdBadge(D: Document, e): Partial<BaseAd> | null {
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

function mineChannel(D: Document, e: any): any {
  const a = D.querySelector('a');
  const channelLink = a?.getAttribute('href');
  const ct = D.querySelector('#text');
  const channelName = ct ? ct.textContent?.trim() : a?.textContent?.trim();

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

function mineBanner(D: Document, e: any): any {
  /* exclude the 'Ads in 2' label, among others */
  if (e.acquired[0].html.length < 350) return null;

  const imgs = D.querySelectorAll('img');
  if (imgs.length === 0) {
    const errorretval = {
      error: true,
      reason: 1,
      images: imgs.length,
      wouldebug: e.acquired[0].html.length > 6000,
      htmlsize: e.acquired[0].html.length,
      texts: D.querySelector('div')?.textContent,
    };
    leafLogE('mineBanner error: %O', errorretval);
    if (e.acquired[0].html.length > 6000) {
      leafLogD('DEBUG HERE!');
    }
    return errorretval;
  }

  const spans = D.querySelectorAll('span');
  if (!spans.length) {
    const errorretval = {
      error: true,
      reason: 2,
      wouldebug: e.acquired[0].html.length > 2000,
      htmlsize: e.acquired[0].html.length,
      texts: D.querySelector('div')?.textContent,
    };
    leafLogE('mineBanner error: %O', errorretval);
    if (e.acquired[0].html.length > 2000) {
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

export const allowedSelectors = [
  'banner',
  'ad',
  'overlay',
  'toprightad',
  'toprightpict',
  'toprightcta',
  'toprightattr',
  'adbadge',
  'channel',
  'searchcard',
  'channellink',
  'searchAds',
];

export function processLeaf(e: Leaf): Ad | null {
  leafLogD('Process leaf %O', e);
  // e is the 'element', it comes from the DB, and we'll look the
  // e.html mostly. different e.selecotrName causes different sub-functions
  if (allowedSelectors.includes(e.selectorName)) {
    // leafLogD("Invalid/Unexpected selector received: %s", e.metadataId);
    return null;
  }

  let mined: any = null;
  try {
    const D = new JSDOM(e.html).window.document;
    // eslint-disable-next-line no-console
    // console.log(e.nature, e.selectorName);

    if (e.selectorName === 'ad') mined = mineAd(D, e);
    else if (e.selectorName === 'banner') mined = mineBanner(D, e);
    else if (e.selectorName === 'overlay') mined = mineOverlay(D, e);
    else if (e.selectorName === 'toprightpict') mined = mineTRP(D, e);
    else if (e.selectorName === 'channel' || e.selectorName === 'channel2')
      mined = mineChannel(D, e);
    else if (e.selectorName === 'adbadge') mined = mineAdBadge(D, e);
    else leafLogger('Selector not handled %s', e.selectorName);

    // eslint-disable-next-line no-console
    // console.log(mined);
  } catch (error) {
    leafLogger(
      'Error in content mining (%s %s): %s',
      e.selectorName,
      e.metadataId,
      error.message
    );
    return null;
  }

  if (_.isNull(mined)) return null;

  const retval = _.pick(e, [
    'nature',
    'selectorName',
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
  if (e.experiment) (retval as any).experiment = e.experiment;

  return {
    ...retval,
    ...mined,
  };
}
