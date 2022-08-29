// mocks
import fetchMock from 'jest-fetch-mock';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { getChromeMock } from '@shared/extension/__mocks__/chrome';

// imports
import { HandshakeActiveResponseArb } from '@shared/arbitraries/HandshakeResponse.arb';
import { boot } from '@shared/extension/app';
import { initializeKey } from '@shared/extension/chrome/background/account';
import { load } from '@shared/extension/chrome/background/index';
import { fc } from '@shared/test';
import { sleep } from '@shared/utils/promise.utils';
import { tiktokDomainRegExp } from '@tktrex/parser/constant';
import * as fs from 'fs';
import * as path from 'path';
import * as app from '../src/app/app';
import * as handlers from '../src/app/handlers';
import api, { getHeadersForDataDonation } from '../src/background/api';
import tkHub from '../src/handlers/hub';
import { tkLog } from '../src/logger';

const chromeListener = jest.fn();

const profileMatcher = app.tkHandlers.profile;
const videoMatcher = app.tkHandlers.video;
const nativeVideoMatcher = app.tkHandlers.nativeVideo;
const searchMatcher = app.searchHandler;
const eventsRegisterSpy = jest.spyOn(handlers, 'registerTkHandlers');
const tkTrexActionsSpy = jest.spyOn(app, 'tkTrexActions');
const hubDispatchSpy = jest.spyOn(tkHub, 'dispatch');
const handleProfileSpy = jest.spyOn(profileMatcher, 'handle');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleNativeVideo = jest.spyOn(nativeVideoMatcher, 'handle');
const handleSearchSpy = jest.spyOn(searchMatcher, 'handle');

let keys = initializeKey();
const tkURL = 'https://tiktok.com/foryou';
const bootOptions = {
  payload: {
    config: keys,
    href: window.location.href,
  } as any,
  mapLocalConfig: (c, p) => ({ ...c, ...p }),
  observe: {
    handlers: app.tkHandlers,
    platformMatch: tiktokDomainRegExp,
    onLocationChange: () => {},
  },
  hub: {
    hub: tkHub,
    onRegister: handlers.registerTkHandlers,
  },
  onAuthenticated: app.tkTrexActions,
};

const researchTag = 'test-tag';

const getConfig = () => ({
  ...keys,
  active: true,
  ux: true,
  href: tkURL,
  researchTag,
  execount: 1,
  testTime: new Date().toISOString(),
});

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const { chrome } = getChromeMock({ backgroundOpts });

describe('TK App - "Native Video" ', () => {
  jest.setTimeout(20 * 1000);

  beforeAll(() => {
    load(backgroundOpts);
    fetchMock.enableMocks();
  });

  afterEach(() => {
    eventsRegisterSpy.mockClear();
    tkTrexActionsSpy.mockClear();
    hubDispatchSpy.mockClear();
    handleProfileSpy.mockClear();
    handleSearchSpy.mockClear();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  jest.setTimeout(30 * 1000);

  test('collect "nativeVideo" when entering in video navigation from "foryou" page', async () => {
    // mock handshake response
    const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
    axiosMock.request.mockResolvedValueOnce({
      data: handshakeResponse,
    });

    chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
    fetchMock.mockResponseOnce(JSON.stringify(getConfig()));
    chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
    fetchMock.mockResponseOnce(JSON.stringify({}));

    const appContext = await boot(bootOptions);

    // response for /v2/events
    axiosMock.request.mockResolvedValueOnce({
      data: {},
    });

    const tkForYouPage = 'https://www.tiktok.com/foryou';
    global.jsdom.reconfigure({
      url: tkForYouPage,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/tk-foryou.html'),
      'utf-8'
    );

    await sleep(1000);

    // custom events should be registered on booting
    expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    expect(tkTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

    await sleep(6000);

    // video handler should be invoked as the url includes `watch`
    expect(handleProfileSpy).not.toHaveBeenCalled();
    expect(handleVideoSpy).toHaveBeenCalledTimes(1);
    expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

    expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
      url: '/v2/events',
      data: [
        {
          type: 'video',
          incremental: 0,
          videoCounter: 1,
          rect: {
            bottom: 0,
            right: 0,
            top: 0,
            left: 0,
            x: 0,
            y: 0,
          },
          href: tkForYouPage,
        },
      ],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Tktrex-Build': process.env.BUILD_DATE,
        'X-Tktrex-NonAuthCookieId': researchTag,
        'X-Tktrex-PublicKey': process.env.PUBLIC_KEY,
        'X-Tktrex-Version': process.env.VERSION,
      },
      method: 'POST',
      responseType: 'json',
    });

    axiosMock.request.mockResolvedValueOnce({
      data: {},
    });

    const tkFirstVideoURL =
      'https://www.tiktok.com/@merveilleux123/video/7135383664971582725';
    global.jsdom.reconfigure({
      url: tkFirstVideoURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/tk-video-1.html'),
      'utf-8'
    );

    await sleep(6000);

    expect(handleProfileSpy).not.toHaveBeenCalled();
    expect(handleVideoSpy).toHaveBeenCalledTimes(2);
    expect(handleNativeVideo).toHaveBeenCalledTimes(1);
    expect(hubDispatchSpy).toHaveBeenCalledTimes(4);

    expect(axiosMock.request.mock.calls[2][0]).toMatchObject({
      url: '/v2/events',
      data: [
        {
          type: 'native',
          incremental: 1,
          videoCounter: 1,
          html: expect.any(String),
          href: tkFirstVideoURL,
        },
      ],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Tktrex-Build': process.env.BUILD_DATE,
        'X-Tktrex-NonAuthCookieId': researchTag,
        'X-Tktrex-PublicKey': process.env.PUBLIC_KEY,
        'X-Tktrex-Version': process.env.VERSION,
      },
      method: 'POST',
      responseType: 'json',
    });

    axiosMock.request.mockResolvedValueOnce({
      data: {},
    });

    const tkSecondVideoURL =
      'https://www.tiktok.com/@denisemanno/video/7118347470546980101';

    global.jsdom.reconfigure({
      url: tkSecondVideoURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/tk-video-2.html'),
      'utf-8'
    );

    await sleep(6000);

    expect(handleProfileSpy).not.toHaveBeenCalled();
    expect(handleVideoSpy).toHaveBeenCalledTimes(3);
    expect(handleNativeVideo).toHaveBeenCalledTimes(2);
    expect(hubDispatchSpy).toHaveBeenCalledTimes(6);

    expect(axiosMock.request.mock.calls[3][0]).toMatchObject({
      url: '/v2/events',
      data: [
        {
          type: 'native',
          incremental: 2,
          videoCounter: 1,
          html: expect.any(String),
          href: tkSecondVideoURL,
        },
      ],
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Tktrex-Build': process.env.BUILD_DATE,
        'X-Tktrex-NonAuthCookieId': researchTag,
        'X-Tktrex-PublicKey': process.env.PUBLIC_KEY,
        'X-Tktrex-Version': process.env.VERSION,
      },
      method: 'POST',
      responseType: 'json',
    });

    appContext.destroy();
  });
});
