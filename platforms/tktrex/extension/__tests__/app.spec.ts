import { boot } from '@shared/extension/app';
import {
  handleServerLookup,
  initializeKey,
} from '@shared/extension/chrome/background/account';
import { load } from '@shared/extension/chrome/background/index';
import { handleSyncMessage } from '@shared/extension/chrome/background/sync';
import axios from 'axios';
import * as fs from 'fs';
import { chrome } from 'jest-chrome';
import * as path from 'path';
import * as app from '../src/app/app';
import api, { getHeadersForDataDonation } from '../src/background/api';
import * as handlers from '../src/handlers/apiSync';
import tkHub from '../src/handlers/hub';
import { tkLog } from '../src/logger';

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const chromeListener = jest.fn();

const videoMatcher = app.tkHandlers.video;

const eventsRegisterSpy = jest.spyOn(handlers, 'register');
const tkTrexActionsSpy = jest.spyOn(app, 'tkTrexActions');
const handleVideoSpy = jest.spyOn(videoMatcher, 'handle');

const backgroundOpts = {
  api: api.API,
  getHeadersForDataDonation,
};

const keys = initializeKey();

describe('TK App', () => {
  jest.setTimeout(20 * 1000);

  it('Page "foryou"', async () => {
    // jest.useRealTimers();

    let supporterId;
    const tkURL = 'https://tiktok.com/foryou';

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
      .mockImplementationOnce((msg, cb: any) => {
        return cb({
          ...keys,
          active: true,
          ux: true,
          href: tkURL,
          evidencetag: 'fake-tag',
          researchTag: '',
          experimentId: '1',
          execount: 1,
          newProfile: false,
          testTime: new Date().toISOString(),
          directiveType: 'comparison',
        });
      })
      // mock 'ServerLookup' message handler
      .mockImplementationOnce((msg: any, cb: any) => {
        tkLog.info('server lookup msg', msg);
        handleServerLookup(backgroundOpts)(msg.payload, (response: any) => {
          if (response._tag === 'Right') {
            supporterId = response.right._id;
          }
          cb(null);
        });
      })
      // mock 'sync' message handler
      .mockImplementationOnce((msg: any, cb: any) => {
        tkLog.info('sync handler mock %O', msg);
        // tkLog.debug('Chrome last error %O', chrome.runtime.lastError);
        try {
          handleSyncMessage(backgroundOpts)(msg, null, cb);
        } catch (e) {
          console.error(e);
          cb(e);
        }
      })
      .mockImplementation((msg, cb: any) => {
        tkLog.info('unhandled msg %O', msg);
        tkLog.debug('Chrome last error %O', chrome.runtime.lastError);

        return cb(null);
      });

    chrome.storage.local.get.mockImplementation((key: any, cb: any) => {
      tkLog.info('Get Storage key %s', keys);
      tkLog.info('Callback %O', cb);
      return cb({ [key]: keys });
    });

    chrome.storage.local.set.mockImplementation((obj, cb: any) => {
      tkLog.info('Set Storage key %s', obj);
      tkLog.info('Callback %O', cb);
      return cb(obj);
    });
    chrome.runtime.onMessage.addListener(chromeListener);

    load(backgroundOpts);

    await boot({
      payload: {
        config: keys,
        href: window.location.href,
      } as any,
      mapLocalConfig: (c, p) => ({ ...c, ...p }),
      observe: {
        handlers: app.tkHandlers,
        onLocationChange: () => {},
      },
      hub: {
        hub: tkHub,
        onRegister: handlers.register,
      },
      onAuthenticated: app.tkTrexActions,
    });

    global.jsdom.reconfigure({
      url: tkURL,
    });

    window.document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'htmls/tk-foryou.html'),
      'utf-8'
    );

    await sleep(2000);

    // custom events should be registered on booting
    expect(eventsRegisterSpy).toHaveBeenCalled();

    // yt callback should be called after server response
    expect(tkTrexActionsSpy).toHaveBeenCalledWith(null);

    await sleep(8000);

    // video handler should be invoked as the url includes `watch`

    const { handle: _handle, ...videoOpts } = videoMatcher;
    expect(handleVideoSpy).toHaveBeenCalledTimes(1);

    const response = await axios
      .get(`${process.env.API_ROOT}/v1/personal/${keys.publicKey}/foryou/json`)
      .catch((e) => {
        console.error(e);
        return e.response.data;
      });

    console.log(response.data);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject([]);
  });
});
