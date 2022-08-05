import { HandshakeActiveResponseArb } from '@shared/arbitraries/HandshakeResponse.arb';
import { boot } from '@shared/extension/app';
import {
  handleServerLookup,
  initializeKey,
} from '@shared/extension/background/account';
import { load } from '@shared/extension/background/index';
import { handleSyncMessage } from '@shared/extension/background/sync';
import { fc } from '@shared/test';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { sleep } from '@shared/utils/promise.utils';
import { tiktokDomainRegExp } from '@tktrex/parser/constant';
import * as fs from 'fs';
import { chrome } from 'jest-chrome';
import * as path from 'path';
import * as app from '../src/app/app';
import * as handlers from '../src/app/handlers';
import api, { getHeadersForDataDonation } from '../src/background/api';
import tkHub from '../src/handlers/hub';
import { tkLog } from '../src/logger';

const chromeListener = jest.fn();

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

chromeListener.mockImplementation((request, sender, sendResponse) => {
  tkLog.info('on listener %O', { request, sender });
  sendResponse({ type: 'Success', response: null });
  return true;
});

const researchTag = 'test-tag';
let dbMap = {
  local: undefined,
};

const getConfig = () => ({
  ...keys,
  active: true,
  ux: true,
  href: tkURL,
  researchTag,
  execount: 1,
  testTime: new Date().toISOString(),
});

chrome.runtime.sendMessage
  // mock first 'chromeConfig' message handler
  // .mockImplementationOnce((msg, cb: any) => {
  //   return cb({ ux: true, active: true });
  // })
  // mock 'LocalLookup' message handler
  .mockImplementation((msg: any, cb: any) => {
    if (msg.type === 'SettingsLookup') {
      const settings = getConfig();
      dbMap.local = settings as any;
      return cb(settings);
      // mock 'LocalLookup' message handler
    } else if (msg.type === 'LocalLookup') {
      return cb(getConfig());
    } else if (msg.type === 'ServerLookup') {
      return handleServerLookup(backgroundOpts)(msg.payload, cb);
    } else if (msg.type === 'sync') {
      return handleSyncMessage(backgroundOpts)(msg, null, cb);
    }
    return cb({
      type: 'Error',
      error: new Error(`Message type ${msg.type} not handled`),
    });
  });

chrome.storage.local.get.mockImplementation((key: any, cb: any) => {
  tkLog.info('Get Storage key %s from %O', key, keys);
  return cb({ [key]: keys });
});

chrome.storage.local.set.mockImplementation((obj, cb: any) => {
  tkLog.info('Set Storage key %s', obj);
  return cb(obj);
});

// mock connect port for 'ConfigUpdate'
const portMock = {
  name: 'ConfigUpdate',
  onMessage: {
    addListener: jest.fn(),
    hasListener: jest.fn(),
    getRules: jest.fn(),
    removeRules: jest.fn(),
  },
  postMessage: jest.fn(),
  disconnect: jest.fn(),
  onDisconnect: jest.fn(),
};

chrome.runtime.connect.mockReturnValue(portMock as any);
chrome.runtime.onMessage.addListener(chromeListener);

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

describe('TK App', () => {
  jest.setTimeout(20 * 1000);

  beforeAll(() => {
    load(backgroundOpts);
  });

  afterEach(() => {
    eventsRegisterSpy.mockClear();
    tkTrexActionsSpy.mockClear();
    hubDispatchSpy.mockClear();
    handleProfileSpy.mockClear();
    handleSearchSpy.mockClear();
  });

  describe('"profile" page scraping', () => {
    test('succeeds with all elements', async () => {
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
      expect(handleVideoSpy).toHaveBeenCalledTimes(1);
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      expect(axiosMock.request.mock.calls[1][0]).toMatchObject({
        url: '/v2/events',
        data: [
          {
            type: 'profile',
            incremental: 0,
            videoCounter: 0,
            rect: undefined,
            href: tkProfileUrl,
          },
        ],
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Tktrex-Build': process.env.BUILD_DATE,
          'X-Tktrex-NonAuthCookieId': '',
          'X-Tktrex-PublicKey': process.env.PUBLIC_KEY,
          'X-Tktrex-Version': process.env.VERSION,
        },
        method: 'POST',
        responseType: 'json',
      });
    });
  });
});
