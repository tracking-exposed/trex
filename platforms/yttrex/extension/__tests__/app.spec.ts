import { boot } from '@shared/extension/app';
import {
  handleServerLookup,
  initializeKey
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

const videoMatcher = app.watchedPaths.video;
const leafMatcher = app.watchedPaths.channel2;

const eventsRegisterSpy = jest.spyOn(events, 'register');
const ytTrexActionsSpy = jest.spyOn(app, 'ytTrexActions');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');
const handleLeafSpy = jest.spyOn(leafMatcher, 'handle');

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const keys = initializeKey();

describe.skip('YT App', () => {
  jest.setTimeout(20 * 1000);

  it('Collect evidence from video page', async () => {
    // jest.useRealTimers();

    let supporterId;
    const ytURL = 'https://www.youtube.com/watch?v=55ud4_Cdbrc';

    chromeListener.mockImplementation((request, sender, sendResponse) => {
      app.ytLogger.info('on listener %O', { request, sender });
      sendResponse({ type: 'Success', response: null });
      return true;
    });

    chrome.runtime.sendMessage
      // mock first 'chromeConfig' message handler
      // .mockImplementationOnce((msg, cb: any) => {
      //   return cb({ ux: true, active: true });
      // })
      // mock 'LocalLookup' message handler
      .mockImplementationOnce((msg, cb: any) => {
        return cb({
          ...keys,
          active: true,
          ux: true,
          href: ytURL,
          evidencetag: 'fake-tag',
          experimentId: '1',
          execount: 1,
          newProfile: false,
          testTime: new Date().toISOString(),
          directiveType: 'comparison',
        });
      })
      // mock 'ServerLookup' message handler
      .mockImplementationOnce((msg: any, cb: any) => {
        app.ytLogger.info('server lookup msg', msg);
        handleServerLookup(backgroundOpts)(msg.payload, (response: any) => {
          if (response._tag === 'Right') {
            supporterId = response.right._id;
          }
          cb(null);
        });
      })
      // mock 'sync' message handler
      .mockImplementationOnce((msg: any, cb: any) => {
        app.ytLogger.info('sync handler mock %O', msg);
        // app.ytLogger.debug('Chrome last error %O', chrome.runtime.lastError);
        try {
          handleSyncMessage(backgroundOpts)(msg, null, cb);
        } catch (e) {
          console.error(e);
          cb(e);
        }
      })
      .mockImplementation((msg, cb: any) => {
        app.ytLogger.info('unhandled msg %O', msg);
        app.ytLogger.debug('Chrome last error %O', chrome.runtime.lastError);

        return cb(null);
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

    load(backgroundOpts);

    boot({
      payload: {
        config: keys,
        href: window.location.href,
      } as any,
      observe: {
        handlers: app.watchedPaths,
        onLocationChange: () => {},
      },
      hub: {
        hub: ytHub,
        onRegister: events.register,
      },
      onAuthenticated: app.ytTrexActions,
    });

    global.jsdom.reconfigure({
      url: ytURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/yt-watch-55ud4_Cdbrc.html'),
      'utf-8'
    );

    await sleep(4000);

    // custom events should be registered on booting
    expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    expect(ytTrexActionsSpy).toHaveBeenCalledWith(null);

    await sleep(12000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ...videoOpts } = videoMatcher;
    expect(handleVideoSpy).toHaveBeenCalledWith(null, videoOpts);
    expect(handleLeafSpy).toBeCalledTimes(102);

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
