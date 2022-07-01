// mocks
import { getChromeMock } from '@shared/extension/__mocks__/chrome.mock';
import fetchMock from 'jest-fetch-mock';

// imports
import { HandshakeActiveResponseArb } from '@shared/arbitraries/HandshakeResponse.arb';
import { boot, BootOpts } from '@shared/extension/app';
import { load } from '@shared/extension/background/index';
import { fc } from '@shared/test';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { sleep } from '@shared/utils/promise.utils';
import { youtubeDomainRegExp } from '@yttrex/shared/parsers/index';
import * as fs from 'fs';
import * as path from 'path';
import * as app from '../src/app/app';
import api, { getHeadersForDataDonation } from '../src/background/api';
import * as events from '../src/handlers/events';
import ytHub from '../src/handlers/hub';

const homeMatcher = app.watchedPaths.home;
const videoMatcher = app.watchedPaths.video;
/* const leafMatcherChannel1 = app.watchedPaths.channel1;
const leafMatcherChannel2 = app.watchedPaths.channel2;
const leafMatcherChannel3 = app.watchedPaths.channel3; */
const leafMatcherBanner = app.watchedPaths.banner;
const ytTrexActionsSpy = jest.spyOn(app, 'ytTrexActions');
const handleHomeSpy = jest.spyOn(homeMatcher, 'handle');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
/* const handleLeafChannel1Spy = jest.spyOn(leafMatcherChannel1, 'handle');
const handleLeafChannel2Spy = jest.spyOn(leafMatcherChannel2, 'handle');
const handleLeafChannel3Spy = jest.spyOn(leafMatcherChannel3, 'handle'); */
const handleLeafBannerSpy = jest.spyOn(leafMatcherBanner, 'handle');
const eventsRegisterSpy = jest.spyOn(events, 'register');

const { ytTrexActions } = app;

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const keys = {
  publicKey: process.env.PUBLIC_KEY as any,
  secretKey: process.env.SECRET_KEY as any,
};
let ytURL: string;
const testTime = new Date().toISOString();

const researchTag = 'fake-tag';
const getConfig = () => ({
  ...keys,
  active: true,
  ux: true,
  href: (() => ytURL)(),
  researchTag,
  experimentId: '1',
  execount: 1,
  testTime,
});

const { chrome } = getChromeMock({ backgroundOpts });

const bootConfig = (): BootOpts => ({
  payload: {
    config: keys,
    href: window.location.href,
  } as any,
  mapLocalConfig: (c, { href, ...config }: any): any => ({
    ...c,
    ...config,
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
    fetchMock.enableMocks();
    load(backgroundOpts);
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  afterEach(() => {
    axiosMock.request.mockClear();
    ytTrexActionsSpy.mockClear();
    handleHomeSpy.mockClear();
    handleVideoSpy.mockClear();
    handleLeafBannerSpy.mockClear();
    /* handleLeafChannel1Spy.mockClear();
    handleLeafChannel2Spy.mockClear();
    handleLeafChannel3Spy.mockClear(); */
  });

  test('Collect evidence from home page', async () => {
    const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
    axiosMock.request.mockResolvedValueOnce({
      data: handshakeResponse,
    });

    chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
    fetchMock.mockResponseOnce(JSON.stringify(getConfig()));
    chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));

    const appContext = await boot(bootConfig());

    // check handshake response
    expect(axiosMock.request.mock.calls[0][0]).toMatchObject({
      url: '/v2/handshake',
      data: {
        config: {
          publicKey: keys.publicKey,
          researchTag,
          execount: 1,
          testTime: new Date(testTime),
        },
        href: 'http://localhost/',
      },
      headers: {
        Accept: 'application/json',
      },
      method: 'POST',
      responseType: 'json',
    });

    ytURL = 'https://www.youtube.com/';

    axiosMock.request.mockResolvedValue({
      data: {},
    });

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
    expect(ytTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ..._videoOpts } = videoMatcher;
    expect(handleHomeSpy).toHaveBeenCalledTimes(1);
    expect(handleVideoSpy).not.toHaveBeenCalled();

    // banner match
    // const { handle: _bannerHandle, ...bannerOpts } = leafMatcherBanner;
    expect(handleLeafBannerSpy).not.toHaveBeenCalled();

    /*
    // channel3 match
    const { handle: _channel1Handle, ...channel1Opts } = leafMatcherChannel1;
    const leafChannel1Count = 30;
    expect(handleLeafChannel1Spy).toHaveBeenCalledTimes(leafChannel1Count);
    Array.from({ length: leafChannel1Count }).map((n, i) => {
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
    const leafChannel2Count = 67;
    expect(handleLeafChannel2Spy).toHaveBeenCalledTimes(leafChannel2Count);

    Array.from({ length: leafChannel2Count }).map((n, i) => {
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
    const leafChannel3Count = 4;
    expect(handleLeafChannel3Spy).toHaveBeenCalledTimes(leafChannel3Count);
    Array.from({ length: leafChannel3Count }).map((n, i) => {
      expect(handleLeafChannel3Spy).toHaveBeenNthCalledWith(
        i + 1,
        expect.any(HTMLElement),
        channel3Opts,
        'channel3',
        expect.any(Object)
      );
    });

    // 1 - POST /v2/handshake
    // 2 - POST /v2/events
    // 2 - POST /v2/events
    expect(axiosMock.request.mock.calls).toHaveLength(3);

    expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
      url: '/v2/events',
      method: 'POST',
      data: Array.from({
        length: leafChannel1Count + leafChannel2Count + leafChannel3Count,
      }).map((n, i) => ({
        incremental: i,
        type: 'leaf',
      })),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-YTtrex-Build': process.env.BUILD_DATE,
        'X-YTtrex-NonAuthCookieId': researchTag,
        'X-YTtrex-PublicKey': keys.publicKey,
        'X-YTtrex-Version': '0.1-TEST',
      },
    });


    expect(axiosMock.request.mock.calls).toHaveLength(2);
    expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
      url: '/v2/events',
      method: 'POST',
      data: [
        {
          type: 'video',
          incremental: 4,
          href: ytURL,
        },
      ],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-YTtrex-Build': process.env.BUILD_DATE,
        'X-YTtrex-NonAuthCookieId': researchTag,
        'X-YTtrex-PublicKey': keys.publicKey,
        'X-YTtrex-Version': '0.1-TEST',
      },
    });
    */
  });

  test('Collect evidence from video page', async () => {
    const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
    axiosMock.request.mockResolvedValueOnce({
      data: handshakeResponse,
    });

    chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
    fetchMock.mockResponseOnce(JSON.stringify(getConfig()));
    chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));

    const appContext = await boot(bootConfig());

    // check handshake response
    expect(axiosMock.request.mock.calls[0][0]).toMatchObject({
      url: '/v2/handshake',
      data: {
        config: {
          publicKey: keys.publicKey,
          researchTag,
          execount: 1,
          testTime: new Date(testTime),
        },
        href: ytURL,
      },
      headers: {
        Accept: 'application/json',
      },
      method: 'POST',
      responseType: 'json',
    });

    axiosMock.request.mockResolvedValue({
      data: {},
    });

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
    expect(ytTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

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
    const leafBannerCount = 2;
    const { handle: _bannerHandle, ...bannerOpts } = leafMatcherBanner;
    expect(handleLeafBannerSpy).toHaveBeenCalledTimes(leafBannerCount);
    expect(handleLeafBannerSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLElement),
      bannerOpts,
      'banner',
      { ...appContext.config, href: ytURL }
    );

    /*
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
    */

    expect(axiosMock.request.mock.calls).toHaveLength(3);

    expect(axiosMock.request.mock.calls[1][0].data).toHaveLength(1);
    expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
      url: '/v2/events',
      method: 'POST',
      data: [{ type: 'leaf' }],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-YTtrex-Build': process.env.BUILD_DATE,
        'X-YTtrex-NonAuthCookieId': researchTag,
        'X-YTtrex-PublicKey': keys.publicKey,
        'X-YTtrex-Version': process.env.VERSION,
      },
    });

    expect(axiosMock.request.mock.calls[2][0]).toMatchObject({
      url: '/v2/events',
      method: 'POST',
      data: [
        {
          type: 'video',
        },
      ],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-YTtrex-Build': process.env.BUILD_DATE,
        'X-YTtrex-NonAuthCookieId': researchTag,
        'X-YTtrex-PublicKey': keys.publicKey,
        'X-YTtrex-Version': process.env.VERSION,
      },
    });
  });
});
