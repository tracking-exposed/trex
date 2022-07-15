import { Logger } from '@shared/logger';
import { OpenURLDirective } from '@shared/models/Directive';
import { DirectiveHooks } from '@shared/providers/puppeteer/DirectiveHook';
import { formatDateTime } from '@shared/utils/date.utils';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import subSeconds from 'date-fns/subSeconds';
import D from 'debug';
import * as fs from 'fs';
import _ from 'lodash';
import nconf from 'nconf';
import path from 'path';
import * as puppeteer from 'puppeteer-core';
import url from 'url';
import { GuardoniProfile } from '../types';

const debug = D('guardoni:youtube');
const logreqst = D('guardoni:requests');
const screendebug = D('guardoni:screenshots');
const bconsError = D('guardoni:error');

debug.enabled = logreqst.enabled = screendebug.enabled = true;

const SCREENSHOT_MARKER = 'SCREENSHOTMARKER';
const scrnshtrgxp = new RegExp(SCREENSHOT_MARKER);

interface GlobalConfig {
  lastScreenTime: Date;
  currentURLlabel: string | null;
  screenshotPrefix: string | null;
  interval: NodeJS.Timer | null;
  publicKeySpot: string | null;
}

const globalConfig: GlobalConfig = {
  lastScreenTime: subSeconds(new Date(), 4),
  currentURLlabel: null,
  screenshotPrefix: null,
  interval: null,
  publicKeySpot: null,
};

export function getScreenshotName(prefix: string): string {
  return `${prefix}-${formatDateTime(new Date())}.png`;
}

export function getMaybeScreenshotFilename(
  lastScreenTime: Date
): string | null {
  /* this function return null if no screenshot has to be taken,
   * and the criteria is to take max one screen every 5 seconds */
  const now = new Date();
  if (differenceInSeconds(now, lastScreenTime) < 5) return null;

  globalConfig.lastScreenTime = now;
  /* screenshotPrefix would exist as a directory */
  return path.join(
    globalConfig.screenshotPrefix ?? '',
    getScreenshotName(globalConfig.currentURLlabel as any)
  );
}

export async function consoleLogParser(
  page: puppeteer.Page,
  message: puppeteer.ConsoleMessage
): Promise<void> {
  /* this function is primarly meant to collect the public key,
   * but it is also an indirect, pseudo-efficent way to communicate
   * between puppeteer evaluated selectors and action we had to do */
  const consoleline = message.text();
  if (globalConfig.publicKeySpot === null && consoleline.match(/publicKey/)) {
    const material = JSON.parse(consoleline);
    globalConfig.publicKeySpot = material.response.publicKey;
  }
  if (consoleline.match(scrnshtrgxp)) {
    const fdestname = getMaybeScreenshotFilename(globalConfig.lastScreenTime);
    // if the screenshot are less than 5 seconds close, the function
    // above would return null, so we don't take it.
    if (fdestname) {
      screendebug('Taking screenshot in [%s]', fdestname);
      await page.screenshot({
        path: fdestname,
        type: 'jpeg',
        fullPage: nconf.get('fullpage') || false,
      });
    }
  }
}

/* these advertising selectors comes from browser extension,
 * and they should be centralized in a piece of updated code */
const advSelectors = [
  '.video-ads.ytp-ad-module',
  '.ytp-ad-player-overlay',
  '.ytp-ad-player-overlay-instream-info',
  'ytd-promoted-sparkles-web-renderer',
  '.ytd-action-companion-ad-renderer',
  '.sparkles-light-cta',
  '[data-google-av-cxn]',
  '#ad-badge',
  'ytd-banner-promo-renderer',
  '.ytd-search-refinement-card-renderer',
  '.ytd-promoted-sparkles-text-search-renderer',
];

const beforeDirectives =
  (ctx: YTHooksContext) =>
  async (page: puppeteer.Page): Promise<void> => {
    page.on('console', (event) => {
      void consoleLogParser(page, event);
    });
    page.on('pageerror', (message) => bconsError('Error %s', message));
    page.on('requestfailed', (request) =>
      bconsError(
        `Requestfail: ${request.failure()?.errorText} ${request.url()}`
      )
    );

    // await page.setRequestInterception(true);
    if (nconf.get('3rd') === true) {
      page.on('request', (e) => manageRequest(ctx.profile, e));
      setInterval(print3rdParties, 60 * 1000);
    }

    if (!nconf.get('screenshots')) return;

    const screenshotsPath = nconf.get('screenshotsPath');
    if (!screenshotsPath) return;

    /* this is to monitor presence of special selectors that
     * should trigger screencapture */
    if (globalConfig.interval) clearInterval(globalConfig.interval);

    globalConfig.screenshotPrefix = path.join(
      screenshotsPath,
      `${ctx.profile.profileName}..${ctx.profile.execount}`
    );

    try {
      fs.mkdirSync(globalConfig.screenshotPrefix);
    } catch (error) {}

    globalConfig.interval = setInterval(function () {
      advSelectors.forEach((selector) => {
        try {
          /* variables from node need to be passed this way to pptr */
          void page.evaluate(
            (selector, SCREENSHOT_MARKER) => {
              const x = document.querySelector(selector);
              if (x) {
                // eslint-disable-next-line no-console
                console.log(SCREENSHOT_MARKER, selector);
              }
            },
            selector,
            SCREENSHOT_MARKER
          );
        } catch (error) {}
      });
    }, nconf.get('screenshotTime') || 5000);
  };

/* this is the variable we populate of statistics
 * on third parties, and every minute, it is printed on terminal */
const thirdParties: { [key: string]: any } = {};
/* and this is the file where logging happen */
let reqlogfilename: undefined | string;

function manageThirdParty(
  profinfo: GuardoniProfile,
  reqpptr: puppeteer.HTTPRequest
): void {
  const up = new url.URL(reqpptr.url());
  const full3rdparty = {
    method: reqpptr.method(),
    host: up.host,
    pathname: up.pathname,
    search: up.search,
    type: reqpptr.resourceType(),
    when: new Date(),
    postData: undefined,
  };
  if (full3rdparty.method !== 'GET')
    full3rdparty.postData = reqpptr.postData() as any;

  reqlogfilename = path.join(
    'profiles',
    profinfo.profileName,
    'requestlog.json'
  );
  fs.appendFileSync(reqlogfilename, JSON.stringify(full3rdparty) + '\n');
  if (up.host !== 'www.youtube.com') {
    if (thirdParties[up.host]) thirdParties[up.host] = 1;
    else thirdParties[up.host] += 1;
  }
}

function manageRequest(
  profinfo: GuardoniProfile,
  reqpptr: puppeteer.HTTPRequest
): void {
  try {
    manageThirdParty(profinfo, reqpptr);
  } catch (error) {
    debug('Error in manageRequest function: %s', (error as any).message);
  }
}

function print3rdParties(): void {
  logreqst(
    'Logged third parties connections in [%s] to %o',
    reqlogfilename,
    thirdParties
  );
}

async function beforeLoad(page: puppeteer.Page, directive: any): Promise<void> {
  globalConfig.currentURLlabel = directive.urltag;
  return Promise.resolve();
}

async function completed(): Promise<string> {
  return globalConfig.publicKeySpot as string;
}

async function beforeWait(page: puppeteer.Page, directive: any): Promise<void> {
  // debug("Nothing in beforeWait but might be screencapture or ad checking");
  return Promise.resolve();
}

async function afterWait(page: puppeteer.Page, directive: any): Promise<void> {
  // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
  // const innerHeight = await page.evaluate(_ => { return window.innerHeight });
  // let hasPlayer = false;
  let state: { player: any; name: string | undefined } = {
    player: undefined,
    name: undefined,
  };

  if (directive.url.match(/\/watch\?v=/)) {
    state = await getYTStatus(page);
    debug('afterWait status found to be: %s', state.name);
    await interactWithYT(page, directive, 'playing');
    // hasPlayer = true;
  }

  if (directive.screenshot) {
    const screendumpf = getScreenshotName(directive.name);
    const fullpath = path.join(directive.profile, screendumpf);
    debug('afterWait: collecting screenshot in %s', fullpath);

    // if (hasPlayer) await state.player.screenshot({ path: fullpath });
    // else
    await page.screenshot({ path: fullpath, fullPage: true });
  }
}

const cookieModal = async (
  page: puppeteer.Page,
  opts: {
    action: 'reject' | 'accept';
  }
): Promise<any> => {
  if (opts) {
    debug('Searching for cookie modal...');
    const hasModal = await page.$('ytd-consent-bump-v2-lightbox');

    if (hasModal) {
      debug('Modal present, searching for buttons...');

      /**
       * Modal buttons
       *
       * buttons[0] -> Language Selector
       * buttons[1] -> "Sign In"
       * buttons[2] -> "More Options"
       * buttons[2] -> "Reject All"
       * buttons[3] -> "Accept App"
       */
      const buttons = await hasModal.$$('tp-yt-paper-button');

      debug('Cookie modal action %s', opts.action);

      if (opts.action === 'reject') {
        const rejectButton = buttons[3];
        await rejectButton.click();
      } else if (opts.action === 'accept') {
        const acceptButton = buttons[4];
        await acceptButton.click();
      }

      debug('Cookie modal close!');
    }
  }
};

const condition = {
  '-1': 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'video cued',
};

async function getYTStatus(page: puppeteer.Page): Promise<{
  name: string;
  player: puppeteer.JSHandle<any>;
}> {
  await page.waitForSelector('#movie_player');
  const yt = await page.evaluateHandle(() =>
    document.querySelector('#movie_player')
  );
  const ele = yt.asElement();
  const st = await ele?.evaluate(function (e) {
    return (e as any).getPlayerState();
  });
  const name = (condition as any)[st]
    ? (condition as any)[st]
    : 'unmanaged-' + st;
  return { name, player: yt };
}

async function interactWithYT(
  page: puppeteer.Page,
  directive: OpenURLDirective,
  wantedState: string
): Promise<any> {
  const DEFAULT_MAX_TIME = 1000 * 60 * 10; // 10 minutes
  // const DEFAULT_WATCH_TIME = 9000;
  const PERIODIC_CHECK_MS = 3000;

  // consenso all'inizio
  // await cookieModal(page);
  // non voglio loggarmi (24 ore)
  // non voglio la prova gratuita (random)

  let state = await getYTStatus(page);
  if (state.name !== wantedState) {
    debug(
      'State switching necessary (now %s, wanted %s)',
      state.name,
      wantedState
    );
    // not really possible guarantee a full mapping of condition. this
    // function only deploy a space press to let video start
  }
  if (state.name === 'unstarted') {
    await (state.player as any).press('Space');
    await page.waitForTimeout(600);
    state = await getYTStatus(page);
  } else
    debug(
      'DO NOT press [space] please, as the video is in state [%s]',
      state.name
    );

  const isError = await page.$('yt-player-error-message-renderer');
  if (!_.isNull(isError)) {
    // eslint-disable-next-line no-console
    console.log('Youtube video error!');
    return;
  }

  debug('Entering watching loop (state %s)', state.name);
  const specialwatch =
    _.isUndefined(directive.watchFor) || directive.watchFor === null
      ? 'end'
      : directive.watchFor;

  // here is managed the special condition directive.watchFor == "end"
  if (specialwatch === 'end') {
    // eslint-disable-next-line no-console
    console.log(directive.url, 'This video would be watched till the end');

    for (const checktime of _.times(DEFAULT_MAX_TIME / PERIODIC_CHECK_MS)) {
      await page.waitForTimeout(PERIODIC_CHECK_MS);
      const newst = await getYTStatus(page);

      if (newst.name === 'unstarted') {
        debug(
          'Check n# %d — Forcing to start? (should not be necessary!)',
          checktime
        );
        await (newst.player as any).press('Space');
      } else if (newst.name === 'ended' || newst.name === 'paused') {
        debug(
          'Video status [%s] at check n#%d — closing loop',
          newst.name,
          checktime
        );
        break;
      } else if (newst.name !== 'playing')
        debug(
          'While video gets reproduced (#%d check) the state is [%s]',
          checktime,
          newst.name
        );
    }
  } else if (_.isString(specialwatch) && specialwatch.endsWith('s')) {
    const ms = parseInt(specialwatch.replace('s', ''), 10) * 1000;
    debug('Special value format %s (%d ms)', specialwatch, ms);

    await page.waitForTimeout(ms);
    const newst = await getYTStatus(page);
    await (newst.player as any).press('Space');
    await getYTStatus(page);
  } else if (_.isInteger(specialwatch)) {
    // eslint-disable-next-line no-console
    console.log(
      directive.url,
      'Watching video for the specified time of:',
      specialwatch,
      'milliseconds'
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    await page.waitForTimeout(specialwatch as any);
    debug('Finished special watchining time of:', specialwatch, 'milliseconds');
  } else {
    const errorMessage = `invalid waitFor value [${directive.watchFor}]`;
    // eslint-disable-next-line no-console
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

type YTHooks = DirectiveHooks<
  'youtube.com',
  {
    interactWithYT: typeof interactWithYT;
    getYTStatus: typeof getYTStatus;
    cookieModal: typeof cookieModal;
  }
>;

interface YTHooksContext {
  logger: Logger;
  profile: GuardoniProfile;
}

export type GetYTHooks = (ctx: YTHooksContext) => YTHooks;
export const GetYTHooks: GetYTHooks = (ctx) => {
  return {
    openURL: {
      beforeDirectives: (p) => beforeDirectives(ctx)(p),
      beforeLoad,
      beforeWait,
      afterWait,
      completed,
    },
    customs: {
      getYTStatus,
      interactWithYT,
      cookieModal,
    },
    DOMAIN_NAME: 'youtube.com' as const,
  };
};
