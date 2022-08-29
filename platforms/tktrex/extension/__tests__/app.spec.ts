import { HandshakeActiveResponseArb } from '@shared/arbitraries/HandshakeResponse.arb';
import { boot, BootOpts } from '@shared/extension/app';
import { load } from '@shared/extension/chrome/background/index';
import { getChromeMock } from '@shared/extension/__mocks__/chrome';
import { fc } from '@shared/test';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { sleep } from '@shared/utils/promise.utils';
import { tiktokDomainRegExp } from '@tktrex/parser/constant';
import * as fs from 'fs';
import * as path from 'path';
import * as app from '../src/app/app';
import * as handlers from '../src/app/handlers';
import api, { getHeadersForDataDonation } from '../src/background/api';
import tkHub from '../src/handlers/hub';

const videoMatcher = app.tkHandlers.video;
const searchMatcher = app.searchHandler;
const eventsRegisterSpy = jest.spyOn(handlers, 'registerTkHandlers');
const tkTrexActionsSpy = jest.spyOn(app, 'tkTrexActions');
const hubDispatchSpy = jest.spyOn(tkHub, 'dispatch');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleSearchSpy = jest.spyOn(searchMatcher, 'handle');

const researchTag = 'fake-tag';
const keys = {
  publicKey: process.env.PUBLIC_KEY as any,
  secretKey: process.env.SECRET_KEY as any,
};

const getConfig = () => ({
  ...keys,
  active: true,
  ux: true,
  href: tkURL,
  researchTag,
  execount: 1,
  experimentId: undefined,
  testTime: new Date().toISOString(),
});

const tkURL = 'https://tiktok.com/foryou';
const bootOptions: BootOpts = {
  payload: {
    config: { ...keys, researchTag },
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

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const chrome = getChromeMock({
  getConfig,
  backgroundOpts,
});

describe('TK App', () => {
  jest.setTimeout(20 * 1000);

  beforeAll(() => {
    load(backgroundOpts);
  });

  afterEach(() => {
    axiosMock.request.mockClear();
    eventsRegisterSpy.mockClear();
    tkTrexActionsSpy.mockClear();
    hubDispatchSpy.mockClear();
    handleVideoSpy.mockClear();
    handleSearchSpy.mockClear();
  });

  describe('"foryou" page scraping', () => {
    test('succeeds with all elements', async () => {
      // jest.useRealTimers();

      const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
      axiosMock.request.mockResolvedValueOnce({
        data: handshakeResponse,
      });

      const appContext = await boot(bootOptions);

      await sleep(2000);

      // check handshake response
      expect(axiosMock.request.mock.calls[0][0]).toMatchObject({
        url: '/v2/handshake',
        data: {
          config: {
            publicKey: process.env.PUBLIC_KEY,
            secretKey: process.env.SECRET_KEY,
            execount: 1,
            researchTag,
            ux: true,
          },
          href: 'http://localhost/',
        },
        headers: {
          Accept: 'application/json',
        },
        method: 'POST',
        responseType: 'json',
      });

      global.jsdom.reconfigure({
        url: tkURL,
      });

      window.document.body.innerHTML = fs.readFileSync(
        path.resolve(__dirname, 'htmls/tk-foryou.html'),
        'utf-8'
      );

      axiosMock.request.mockResolvedValueOnce({
        data: {},
      });

      await sleep(1000);

      // custom events should be registered on booting
      expect(eventsRegisterSpy).toHaveBeenCalled();

      // yt callback should be called after server response
      expect(tkTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

      await sleep(12000);

      appContext.destroy();

      // video handler should be invoked as the url includes `watch`

      const { handle: _handle, ...videoOpts } = videoMatcher;
      expect(handleVideoSpy).toHaveBeenCalledTimes(1);
      expect(handleSearchSpy).not.toHaveBeenCalled();
      // one for the contribution 'video' event and one for "sync" event
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      expect(axiosMock.request.mock.calls).toHaveLength(2);
      expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
        url: '/v2/events',
        data: [
          {
            feedCounter: 0,
            href: tkURL,
            type: 'video',
            videoCounter: 1,
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
      });
    });
  });

  describe('"search" page scraping', () => {
    test('succeeds with all elements', async () => {
      const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
      axiosMock.request.mockResolvedValueOnce({
        data: handshakeResponse,
      });

      const appContext = await boot(bootOptions);

      axiosMock.request.mockResolvedValueOnce({
        data: {},
      });

      const tkSearchUrl = 'https://www.tiktok.com/search?q=tartariá';
      global.jsdom.reconfigure({
        url: tkSearchUrl,
      });

      window.document.body.innerHTML = fs.readFileSync(
        path.resolve(__dirname, 'htmls/tk-search-tartaria.html'),
        'utf-8'
      );

      await sleep(1000);

      // check handshake response
      expect(axiosMock.request.mock.calls[0][0]).toMatchObject({
        url: '/v2/handshake',
        data: {
          config: {
            publicKey: process.env.PUBLIC_KEY,
            secretKey: process.env.SECRET_KEY,
            execount: 1,
            researchTag,
            ux: true,
          },
          href: 'http://localhost/',
        },
        headers: {
          Accept: 'application/json',
        },
        method: 'POST',
        responseType: 'json',
      });

      // custom events should be registered on booting
      expect(eventsRegisterSpy).toHaveBeenCalled();

      // yt callback should be called after server response
      expect(tkTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

      await sleep(12000);
      appContext.destroy();

      // video handler should be invoked as the url includes `watch`

      const { handle: _handle, ...videoOpts } = videoMatcher;
      expect(handleVideoSpy).toHaveBeenCalledTimes(2);
      expect(handleSearchSpy).toHaveBeenCalledTimes(48);
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      expect(axiosMock.request.mock.calls).toHaveLength(2);
      expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
        url: '/v2/events',
        data: [
          {
            href: encodeURI(tkSearchUrl),
            type: 'search',
            incremental: 1,
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
      });
    });
  });
});
