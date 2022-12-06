// mocks
import { getChromeMock } from '@shared/extension/__mocks__/chrome.mock';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import fetchMock from 'jest-fetch-mock';

// imports
import { HandshakeActiveResponseArb } from '@shared/arbitraries/HandshakeResponse.arb';
import { boot, BootOpts } from '@shared/extension/app';
import { initializeKey } from '@shared/extension/background/account';
import { load } from '@shared/extension/background/index';
import { fc } from '@shared/test';
import { sleep } from '@shared/utils/promise.utils';
import { tiktokDomainRegExp } from '@tktrex/parser/v2/constant';
import * as fs from 'fs';
import * as path from 'path';
import * as app from '../src/app/app';
import api, { getHeadersForDataDonation } from '../src/background/api';
import tkHub, * as handlers from '../src/app/hub';

const profileMatcher = app.tkHandlers.profile;
const videoMatcher = app.tkHandlers.video;
const searchMatcher = app.searchHandler;
const eventsRegisterSpy = jest.spyOn(handlers, 'registerTkHandlers');
const tkTrexActionsSpy = jest.spyOn(app, 'tkTrexActions');
const hubDispatchSpy = jest.spyOn(tkHub, 'dispatch');
const handleProfileSpy = jest.spyOn(profileMatcher, 'handle');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleSearchSpy = jest.spyOn(searchMatcher, 'handle');

let keys = initializeKey();
const firstURL = window.location.href;
let tkURL = 'https://tiktok.com/foryou';
const bootOptions: BootOpts = {
  payload: {
    config: keys,
    href: firstURL,
  } as any,
  mapLocalConfig: (c, p) => ({ ...c, ...p }),
  observe: {
    handlers: app.tkHandlers,
    platformMatch: tiktokDomainRegExp,
    onLocationChange: app.onLocationChange,
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
  href: (() => tkURL)(),
  researchTag,
  execount: 1,
  testTime: new Date().toISOString(),
});

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const { chrome, clearDB } = getChromeMock({
  getConfig,
  backgroundOpts,
});

describe('TK App - profile ', () => {
  jest.setTimeout(20 * 1000);

  beforeAll(() => {
    load(backgroundOpts);
    fetchMock.enableMocks();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  afterEach(() => {
    eventsRegisterSpy.mockClear();
    tkTrexActionsSpy.mockClear();
    hubDispatchSpy.mockClear();
    handleProfileSpy.mockClear();
    handleSearchSpy.mockClear();
    clearDB();
  });

  describe('"profile" page scraping', () => {
    test('succeeds with all elements', async () => {
      chrome.runtime.getURL.mockReturnValueOnce('file://settings.json');
      fetchMock.mockResponseOnce(JSON.stringify(getConfig()));
      chrome.runtime.getURL.mockReturnValueOnce('file://experiment.json');
      fetchMock.mockResponseOnce(JSON.stringify({}));

      // mock handshake response
      const handshakeResponse = fc.sample(HandshakeActiveResponseArb, 1)[0];
      axiosMock.request.mockResolvedValueOnce({
        data: handshakeResponse,
      });

      const appContext = await boot(bootOptions);

      // response for /v2/events
      axiosMock.request.mockResolvedValueOnce({
        data: {},
      });

      const tkProfileUrl = 'https://www.tiktok.com/@alalei77';
      global.jsdom.reconfigure({
        url: tkProfileUrl,
      });

      window.document.body.innerHTML = fs.readFileSync(
        path.resolve(__dirname, 'htmls/tk-profile.html'),
        'utf-8'
      );

      await sleep(1000);

      // custom events should be registered on booting
      expect(eventsRegisterSpy).toHaveBeenCalled();

      // yt callback should be called after server response
      expect(tkTrexActionsSpy).toHaveBeenCalledWith(handshakeResponse);

      await sleep(12000);
      appContext.destroy();

      // video handler should be invoked as the url includes `watch`
      expect(handleProfileSpy).toHaveBeenCalledTimes(1);
      expect(handleVideoSpy).toHaveBeenCalledTimes(2);
      // at this point the dispatch should have been called for
      // - sigiState
      // - profile
      // - sync
      expect(hubDispatchSpy).toHaveBeenCalledTimes(3);

      const { href, ...config } = appContext.config;
      expect(axiosMock.request).toHaveBeenNthCalledWith(1, {
        url: '/v2/handshake',
        data: { config: config, href: firstURL },
        headers: {
          Accept: 'application/json',
        },
        params: undefined,
        paramsSerializer: expect.any(Function),
        method: 'POST',
        responseType: 'json',
      });

      // sigi state
      expect(axiosMock.request).toHaveBeenNthCalledWith(2, {
        url: '/v2/events',
        data: [expect.any(Object), expect.any(Object)],
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': expect.any(Number),
          'X-Tktrex-Build': process.env.BUILD_DATE,
          'X-Tktrex-NonAuthCookieId': researchTag,
          'X-Tktrex-PublicKey': process.env.PUBLIC_KEY,
          'X-Tktrex-Signature': expect.any(String),
          'X-Tktrex-Version': process.env.VERSION,
        },
        method: 'POST',
        params: undefined,
        paramsSerializer: expect.any(Function),
        responseType: 'json',
      });
    });
  });
});
