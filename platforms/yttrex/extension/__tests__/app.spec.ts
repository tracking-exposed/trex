import { boot } from '@shared/extension/app';
import {
  handleServerLookup,
  initializeKey,
} from '@shared/extension/chrome/background/account';
import { load } from '@shared/extension/chrome/background/index';
import { handleSyncMessage } from '@shared/extension/chrome/background/sync';
import config from '@shared/extension/config';
import { sleep } from '@shared/utils/promise.utils';
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
// const leafMatcherChannel2 = app.watchedPaths.channel2;

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const keys = initializeKey();
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
  evidencetag: 'fake-tag',
  researchTag: '',
  experimentId: '1',
  execount: 1,
  newProfile: false,
  testTime: new Date().toISOString(),
  directiveType: 'comparison',
});

chrome.runtime.sendMessage
  // mock 'LocalLookup' message handler
  .mockImplementation((msg: any, cb: any) => {
    // mock 'LocalLookup' message handler
    if (msg.type === 'LocalLookup') {
      return cb(getConfig());
      // mock 'ServerLookup' message handler
    } else if (msg.type === 'ServerLookup') {
      return handleServerLookup(backgroundOpts)(
        msg.payload,
        (response: any) => {
          if (response._tag === 'Right') {
            supporterId = response.right._id;
            return cb(response.right);
          }
          cb(null);
        }
      );
      // mock 'sync' message handler
    } else if (msg.type === 'sync') {
      try {
        return handleSyncMessage(backgroundOpts)(msg, null, cb);
      } catch (e) {
        console.error(e);
        cb(e);
      }
    }
    app.ytLogger.info('unhandled msg %s', msg.type);
    cb(null);
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

const eventsRegisterSpy = jest.spyOn(events, 'register');
const ytTrexActionsSpy = jest.spyOn(app, 'ytTrexActions');
const handleHomeSpy = jest.spyOn(homeMatcher, 'handle');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
// const handleLeafChannel2Spy = jest.spyOn(leafMatcherChannel2, 'handle');

describe('YT App', () => {
  jest.setTimeout(30 * 1000);

  beforeAll(async () => {
    load(backgroundOpts);

    await boot({
      payload: {
        config: keys,
        href: window.location.href,
      } as any,
      mapLocalConfig: (c, { href, config }: any): any => ({
        config: {
          ...config,
          ...c,
        },
        href,
      }),
      observe: {
        handlers: app.watchedPaths,
        onLocationChange: () => {},
      },
      hub: {
        hub: ytHub,
        onRegister: (h, c) => {
          events.register(h, c);
        },
      },
      onAuthenticated: app.ytTrexActions,
    });
  });

  test('Collect evidence from home page', async () => {
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

    // custom events should be registered on booting
    // expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    // expect(ytTrexActionsSpy).toHaveBeenCalledWith(null);

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ...videoOpts } = videoMatcher;
    // expect(handleLeafChannel2Spy).toBeCalledTimes(67);
    expect(handleHomeSpy).toHaveBeenCalledTimes(1);

    const response = await axios
      .get(`${process.env.API_ROOT}/v1/personal/${keys.publicKey}`)
      .catch((e) => {
        console.error(e);
        return e.response.data;
      });

    expect(response.status).toBe(200);
    expect(response.data.ads.length).toBeGreaterThanOrEqual(0);
    // expect(response.data.ads.length).toBeGreaterThanOrEqual(65);
    expect(response.data).toMatchObject({
      supporter: {
        publicKey: keys.publicKey,
        version: config.VERSION,
        hereSince: 'a few seconds',
      },
      videos: [],
      stats: {},
    });
  });

  test('Collect evidence from video page', async () => {
    // jest.useRealTimers();

    ytURL = 'https://www.youtube.com/watch?v=55ud4_Cdbrc';

    global.jsdom.reconfigure({
      url: ytURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/yt-watch-55ud4_Cdbrc.html'),
      'utf-8'
    );

    await sleep(4000);

    // custom events should be registered on booting
    // expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    // expect(ytTrexActionsSpy).toHaveBeenCalledWith(null);

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ...videoOpts } = videoMatcher;
    expect(handleVideoSpy).toHaveBeenCalledWith(
      window.document.body,
      videoOpts
    );
    // expect(handleLeafChannel2Spy).toBeCalledTimes(102);

    const response = await axios
      .get(`${process.env.API_ROOT}/v1/personal/${keys.publicKey}`)
      .catch((e) => {
        console.error(e);
        return e.response.data;
      });

    expect(response.status).toBe(200);
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
      },
    });
  });
});
