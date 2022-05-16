import { boot } from '@shared/extension/app';
import {
  handleServerLookup,
  initializeKey,
} from '@shared/extension/chrome/background/account';
import { load } from '@shared/extension/chrome/background/index';
import { handleSyncMessage } from '@shared/extension/chrome/background/sync';
import { tiktokDomainRegExp } from '@tktrex/parser/constant';
import axios from 'axios';
import * as fs from 'fs';
import { chrome } from 'jest-chrome';
import * as path from 'path';
import * as app from '../src/app/app';
import * as handlers from '../src/app/handlers';
import api, { getHeadersForDataDonation } from '../src/background/api';
import tkHub from '../src/handlers/hub';
import { tkLog } from '../src/logger';

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const chromeListener = jest.fn();

const videoMatcher = app.tkHandlers.video;
const searchMatcher = app.searchHandler;
const eventsRegisterSpy = jest.spyOn(handlers, 'registerTkHandlers');
const tkTrexActionsSpy = jest.spyOn(app, 'tkTrexActions');
const hubDispatchSpy = jest.spyOn(tkHub, 'dispatch');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleSearchSpy = jest.spyOn(searchMatcher, 'handle');

let keys = initializeKey();
let supporterId;
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

chrome.runtime.sendMessage
  // mock first 'chromeConfig' message handler
  // .mockImplementationOnce((msg, cb: any) => {
  //   return cb({ ux: true, active: true });
  // })
  // mock 'LocalLookup' message handler
  .mockImplementation((msg: any, cb: any) => {
    if (msg.type === 'LocalLookup') {
      return cb({
        ...keys,
        active: true,
        ux: true,
        href: tkURL,
        evidencetag: 'fake-tag',
        researchTag: 'test-tag',
        execount: 1,
        newProfile: true,
        testTime: new Date().toISOString(),
      });
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
    handleVideoSpy.mockClear();
    handleSearchSpy.mockClear();
  });

  describe('"foryou" page scraping', () => {
    test('succeeds with all elements', async () => {
      // jest.useRealTimers();

      const appContext = await boot(bootOptions);

      global.jsdom.reconfigure({
        url: tkURL,
      });

      window.document.body.innerHTML = fs.readFileSync(
        path.resolve(__dirname, 'htmls/tk-foryou.html'),
        'utf-8'
      );

      await sleep(1000);

      // custom events should be registered on booting
      expect(eventsRegisterSpy).toHaveBeenCalled();

      // yt callback should be called after server response
      expect(tkTrexActionsSpy).toHaveBeenCalledWith({ ignored: true });

      await sleep(12000);

      appContext.destroy();

      // video handler should be invoked as the url includes `watch`

      const { handle: _handle, ...videoOpts } = videoMatcher;
      expect(handleVideoSpy).toHaveBeenCalledTimes(1);
      expect(handleSearchSpy).not.toHaveBeenCalled();
      // one for the contribution 'video' event and one for "sync" event
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      const response = await axios
        .get(
          `${process.env.API_ROOT}/v1/personal/${keys.publicKey}/foryou/json`
        )
        .catch((e) => {
          console.error(e);
          return e.response?.data;
        });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject([
        {
          author: {
            link: '/@yuuna_1210',
            name: '悠那🌹🌕',
            username: 'yuuna_1210',
          },
          baretext: '🌹🌕',
          description: '🌹🌕#おすすめ #コスプレ #制服',
          hashtags: ['#おすすめ', '#コスプレ', '#制服'],
          metrics: { commentn: '236', liken: '10K', sharen: '167' },
          music: {
            name: 'TJR Eat God See Acid Noslek Milkshake Edit - ДабаДамбиев',
            url: '/music/TJR-Eat-God-See-Acid-Noslek-Milkshake-Edit-7036689888661506817',
          },
          order: 1,
          type: 'foryou',
        },
      ]);
    });
  });

  describe('"search" page scraping', () => {
    test('succeeds with all elements', async () => {
      const appContext = await boot(bootOptions);

      const tkSearchUrl = 'https://www.tiktok.com/search?q=tartariá';
      global.jsdom.reconfigure({
        url: tkSearchUrl,
      });

      window.document.body.innerHTML = fs.readFileSync(
        path.resolve(__dirname, 'htmls/tk-search-tartaria.html'),
        'utf-8'
      );

      await sleep(1000);

      // custom events should be registered on booting
      expect(eventsRegisterSpy).toHaveBeenCalled();

      // yt callback should be called after server response
      expect(tkTrexActionsSpy).toHaveBeenCalledWith({ ignored: true });

      await sleep(12000);
      appContext.destroy();

      // video handler should be invoked as the url includes `watch`

      const { handle: _handle, ...videoOpts } = videoMatcher;
      expect(handleVideoSpy).toHaveBeenCalledTimes(2);
      expect(handleSearchSpy).toHaveBeenCalledTimes(48);
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      const response = await axios
        .get(
          `${process.env.API_ROOT}/v1/personal/${keys.publicKey}/search/json`
        )
        .catch((e) => {
          console.error(e);
          return e.response?.data;
        });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        counters: { metadata: 1 },
        metadata: [
          {
            query: 'tartariá',
            rejected: false,
            results: 24,
            sources: [
              '@trutherwarrior111',
              '@manifestation1776',
              '@t.a.r.t.a.r.i.a',
              '@anonymouslightworker',
              '@thedoctorregenerated',
              '@ancientartist333',
              '@gabyzacara333',
              '@iamfitzy',
              '@two_dollar_trey',
              '@dantok_',
              '@alphatalkz_98',
              '@onefoulwow2',
              '@sometr0ll',
              '@kiril.romanov',
              '@lessandro2021',
              '@goddessmamma',
              '@caesarthegrape',
              '@tartaria_reset_secret',
            ],
          },
        ],
      });
    });
  });
});
