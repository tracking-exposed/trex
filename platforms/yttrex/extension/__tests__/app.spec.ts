import { boot, BootOpts } from '@shared/extension/app';
import { handleServerLookup } from '@shared/extension/chrome/background/account';
import { load } from '@shared/extension/chrome/background/index';
import { handleSyncMessage } from '@shared/extension/chrome/background/sync';
import config from '@shared/extension/config';
import { sleep } from '@shared/utils/promise.utils';
import { youtubeDomainRegExp } from '@yttrex/shared/parsers/index';
import axios from 'axios';
import * as fs from 'fs';
import { chrome } from 'jest-chrome';
import * as path from 'path';
import * as app from '../src/app/app';
import api, { getHeadersForDataDonation } from '../src/chrome/background/api';
import * as events from '../src/handlers/events';
import ytHub from '../src/handlers/hub';

const chromeListener = jest.fn();

const homeMatcher = app.watchedPaths.home;
const videoMatcher = app.watchedPaths.video;
const leafMatcherChannel1 = app.watchedPaths.channel1;
const leafMatcherChannel2 = app.watchedPaths.channel2;
const leafMatcherChannel3 = app.watchedPaths.channel3;
const leafMatcherBanner = app.watchedPaths.banner;
const ytTrexActionsSpy = jest.spyOn(app, 'ytTrexActions');
const handleHomeSpy = jest.spyOn(homeMatcher, 'handle');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleLeafChannel1Spy = jest.spyOn(leafMatcherChannel1, 'handle');
const handleLeafChannel2Spy = jest.spyOn(leafMatcherChannel2, 'handle');
const handleLeafChannel3Spy = jest.spyOn(leafMatcherChannel3, 'handle');
const handleLeafBannerSpy = jest.spyOn(leafMatcherBanner, 'handle');
const eventsRegisterSpy = jest.spyOn(events, 'register');

const { ytTrexActions } = app;

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const keys = {
  publicKey: process.env.PUBLIC_KEY,
  secretKey: process.env.SECRET_KEY,
};
let supporterId: string, ytURL: string;

chromeListener.mockImplementation((request, sender, sendResponse) => {
  app.ytLogger.info('on listener %O', { request, sender });
  sendResponse({ type: 'Success', response: null });
  return true;
});

const getConfig = () => ({
  ...keys,
  active: true,
  ux: true,
  href: (() => ytURL)(),
  researchTag: 'fake-tag',
  experimentId: '1',
  execount: 1,
  newProfile: false,
  testTime: new Date().toISOString(),
});

chrome.runtime.sendMessage
  // mock 'LocalLookup' message handler
  .mockImplementation((msg: any, cb: any) => {
    // mock 'LocalLookup' message handler
    if (msg.type === 'LocalLookup') {
      return cb(getConfig());
      // mock 'ServerLookup' message handler
    } else if (msg.type === 'ServerLookup') {
      return handleServerLookup(backgroundOpts)(msg.payload, cb);
      // mock 'sync' message handler
    } else if (msg.type === 'sync') {
      return handleSyncMessage(backgroundOpts)(msg, null, cb);
    }
    app.ytLogger.info('unhandled msg %s', msg.type);
    cb(new Error(`Unhandled msg ${msg} in chrome mock`), null);
  });

chrome.storage.local.get.mockImplementation((key: any, cb: any) => {
  app.ytLogger.info('Get Storage key %s', keys);
  app.ytLogger.info('Callback %O', cb);
  return cb({ [key]: keys });
});

chrome.storage.local.set.mockImplementation((obj, cb: any) => {
  app.ytLogger.info('Set Storage key %s', obj);
  app.ytLogger.info('Callback %O', cb);
  return cb(obj);
});

chrome.runtime.onMessage.addListener(chromeListener);

const bootConfig = (): BootOpts => ({
  payload: {
    config: keys,
    href: window.location.href,
  } as any,
  mapLocalConfig: (c, { href, config }: any): any => ({
    ...config,
    ...c,
    href,
  }),
  observe: {
    handlers: app.watchedPaths,
    platformMatch: youtubeDomainRegExp,
    onLocationChange: app.onLocationChange,
  },
  hub: {
    hub: ytHub,
    onRegister: (h, c) => {
      events.register(h, c);
    },
  },
  onAuthenticated: ytTrexActions,
});

describe('YT App', () => {
  jest.setTimeout(60 * 1000);

  beforeAll(async () => {
    load(backgroundOpts);
  });

  afterEach(() => {
    ytTrexActionsSpy.mockClear();
    handleHomeSpy.mockClear();
    handleVideoSpy.mockClear();
    handleLeafBannerSpy.mockClear();
    handleLeafChannel1Spy.mockClear();
    handleLeafChannel2Spy.mockClear();
    handleLeafChannel3Spy.mockClear();
  });

  test('Collect evidence from home page', async () => {
    const appContext = await boot(bootConfig());

    ytURL = 'https://www.youtube.com/';

    // navigate to youtube home
    global.jsdom.reconfigure({
      url: ytURL,
    });

    // load yt home html
    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/yt-home.html'),
      'utf-8'
    );

    await sleep(4000);

    appContext.destroy();

    // custom events should be registered on booting
    expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    expect(ytTrexActionsSpy).toHaveBeenCalled();

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ..._videoOpts } = videoMatcher;
    expect(handleHomeSpy).toHaveBeenCalledTimes(1);
    expect(handleVideoSpy).not.toHaveBeenCalled();

    // banner match
    // const { handle: _bannerHandle, ...bannerOpts } = leafMatcherBanner;
    expect(handleLeafBannerSpy).not.toHaveBeenCalled();

    // channel3 match
    const { handle: _channel1Handle, ...channel1Opts } = leafMatcherChannel1;
    expect(handleLeafChannel1Spy).toHaveBeenCalledTimes(30);
    Array.from({ length: 30 }).map((n, i) => {
      expect(handleLeafChannel1Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel1Opts,
        'channel1',
        expect.any(Object)
      );
    });

    // channel2 match
    const { handle: _channel2Handle, ...channel2Opts } = leafMatcherChannel2;
    expect(handleLeafChannel2Spy).toHaveBeenCalledTimes(67);

    Array.from({ length: 67 }).map((n, i) => {
      expect(handleLeafChannel2Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel2Opts,
        'channel2',
        expect.any(Object)
      );
    });

    // channel3 match
    const { handle: _channel3Handle, ...channel3Opts } = leafMatcherChannel3;
    expect(handleLeafChannel3Spy).toHaveBeenCalledTimes(4);
    Array.from({ length: 4 }).map((n, i) => {
      expect(handleLeafChannel3Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel3Opts,
        'channel3',
        expect.any(Object)
      );
    });

    const response = await axios
      .get(`${process.env.API_ROOT}/v1/personal/${keys.publicKey}`)
      .catch((e) => {
        console.error(e);
        return e.response.data;
      });

    expect(response.status).toBe(200);
    expect(response.data.ads.length).toBe(100);

    expect(response.data).toMatchObject({
      supporter: {
        publicKey: keys.publicKey,
        version: config.VERSION,
        hereSince: 'a few seconds',
      },
      stats: {
        home: 1,
      },
    });
  });

  test('Collect evidence from video page', async () => {
    const appContext = await boot(bootConfig());

    ytURL = 'https://www.youtube.com/watch?v=55ud4_Cdbrc';

    global.jsdom.reconfigure({
      url: ytURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/yt-watch-55ud4_Cdbrc.html'),
      'utf-8'
    );

    await sleep(4000);

    appContext.destroy();

    // custom events should be registered on booting
    expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    expect(ytTrexActionsSpy).toHaveBeenCalledWith({ ignored: true });

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ...videoOpts } = videoMatcher;
    expect(handleVideoSpy).toHaveBeenCalledWith(
      window.document.body,
      videoOpts,
      'video',
      { ...appContext.config, href: ytURL }
    );
    expect(handleVideoSpy).toBeCalledTimes(1);

    // banner match
    const { handle: _bannerHandle, ...bannerOpts } = leafMatcherBanner;
    expect(handleLeafBannerSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLElement),
      bannerOpts,
      'banner',
      { ...appContext.config, href: ytURL }
    );
    expect(handleLeafBannerSpy).toHaveBeenCalledTimes(2);

    // channel3 match
    const leafChannel1Count = 132;
    const { handle: _channel1Handle, ...channel1Opts } = leafMatcherChannel1;
    expect(handleLeafChannel1Spy).toHaveBeenCalledTimes(leafChannel1Count);
    Array.from({ length: leafChannel1Count }).map((n, i) => {
      expect(handleLeafChannel1Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel1Opts,
        'channel1',
        { ...appContext.config, href: ytURL }
      );
    });

    // channel2
    const leafChannel2Count = 204;
    const { handle: _channel2Handle, ...channel2Opts } = leafMatcherChannel2;
    expect(handleLeafChannel2Spy).toHaveBeenCalledTimes(leafChannel2Count);

    Array.from({ length: leafChannel2Count }).map((n, i) => {
      expect(handleLeafChannel2Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel2Opts,
        'channel2',
        { ...appContext.config, href: ytURL }
      );
    });

    // channel3 match
    const leafChannel3Count = 22;
    const { handle: _channel3Handle, ...channel3Opts } = leafMatcherChannel3;
    expect(handleLeafChannel3Spy).toHaveBeenCalledTimes(leafChannel3Count);
    Array.from({ length: leafChannel3Count }).map((n, i) => {
      expect(handleLeafChannel3Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel3Opts,
        'channel3',
        { ...appContext.config, href: ytURL }
      );
    });

    const response = await axios
      .get(`${process.env.API_ROOT}/v1/personal/${keys.publicKey}`)
      .catch((e) => {
        console.error(e);
        return e.response.data;
      });

    expect(response.status).toBe(200);
    expect(response.data.ads.length).toBe(100);
    expect(response.data).toMatchObject({
      supporter: {
        publicKey: keys.publicKey,
        version: config.VERSION,
        hereSince: 'a few seconds',
      },
      videos: [
        {
          videoId: '55ud4_Cdbrc',
          authorName: 'Kerim Akarpat',
          authorSource: '/channel/UC8Zr1C6gwthR_909q_9E00g',
          relatedN: 19,
          relative: 'a few seconds ago',
        },
      ],
      stats: {
        video: 1,
        home: 1,
      },
    });
  });
});
