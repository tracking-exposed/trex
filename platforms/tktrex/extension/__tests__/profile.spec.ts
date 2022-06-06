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
    handleProfileSpy.mockClear();
    handleSearchSpy.mockClear();
  });

  describe('"profile" page scraping', () => {
    test('succeeds with all elements', async () => {
      const appContext = await boot(bootOptions);

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
      expect(tkTrexActionsSpy).toHaveBeenCalledWith({ ignored: true });

      await sleep(12000);
      appContext.destroy();

      // video handler should be invoked as the url includes `watch`

      expect(handleProfileSpy).toHaveBeenCalledTimes(1);
      expect(handleVideoSpy).toHaveBeenCalledTimes(1);
      expect(hubDispatchSpy).toHaveBeenCalledTimes(2);

      const profileResponse = await axios
        .get(
          `${process.env.API_ROOT}/v1/personal/${keys.publicKey}/profile/json`
        )
        .catch((e) => {
          console.error(e);
          return e.response?.data;
        });

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.data).toMatchObject({
        counters: { metadata: 1 },
        metadata: [
          {
            amount: 30,
            creatorName: 'alalei77',
            results: [
              {
                order: 1,
                video: {
                  type: 'video',
                  videoId: '7103486912966561029',
                  authorId: '@alalei77',
                },
                title: '',
                views: '294',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/deaaee87fac3436b926aed03312a6860?x-expires=1653933600&x-signature=VNRRF1s8tQ2isRDC%2F1SqrwP4340%3D',
              },
              {
                order: 2,
                video: {
                  type: 'video',
                  videoId: '7103211672575266053',
                  authorId: '@alalei77',
                },
                title: '',
                views: '73.1K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/25f0377a8d5a41faa4e0e94845da454c?x-expires=1653933600&x-signature=rygJKD8QjRiWC3xoQhVuDtGVhvI%3D',
              },
              {
                order: 3,
                video: {
                  type: 'video',
                  videoId: '7103123666128375046',
                  authorId: '@alalei77',
                },
                title: '@lalago77',
                views: '5444',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/6162f23428f84b80adeed45a0dcce0a3?x-expires=1653933600&x-signature=OCGP2LnVU9tO3CMIbILBuNvo%2BhI%3D',
              },
              {
                order: 4,
                video: {
                  type: 'video',
                  videoId: '7102384770432175366',
                  authorId: '@alalei77',
                },
                title: '@lalago77',
                views: '14.9K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/48c7483922634504b8652e0155e3a80f?x-expires=1653933600&x-signature=ZVdTpUdHDPqWEfz6kMO0Zh7f6ws%3D',
              },
              {
                order: 5,
                video: {
                  type: 'video',
                  videoId: '7102063820495015174',
                  authorId: '@alalei77',
                },
                title: '@lalago77 #fyp',
                views: '20.7K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/a4b28b3126d54c1fab6cfc21260ce3b2?x-expires=1653933600&x-signature=NqcSvdYNYsPjZvbxzWhFVJteLAI%3D',
              },
              {
                order: 6,
                video: {
                  type: 'video',
                  videoId: '7101825977512135942',
                  authorId: '@alalei77',
                },
                title: '@lalago77',
                views: '1M',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/981c80e982a944e6aa1719a12ffdf1b3?x-expires=1653933600&x-signature=lu4MouPSypiSS6cIp35D6BKSVgw%3D',
              },
              {
                order: 7,
                video: {
                  type: 'video',
                  videoId: '7101794732585667846',
                  authorId: '@alalei77',
                },
                title: '',
                views: '14.8K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/ae8acc80802a4ab1a51eec53052d035e?x-expires=1653933600&x-signature=oehy2j%2By5hPp7qejxt0W62RBXH0%3D',
              },
              {
                order: 8,
                video: {
                  type: 'video',
                  videoId: '7101316489499708678',
                  authorId: '@alalei77',
                },
                title: '@lalago77',
                views: '21.8K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/4c33d26300de428c803b5dbfcb78e864?x-expires=1653933600&x-signature=vUtRnif3JGoeX%2BU%2BOE6sZxLEvV0%3D',
              },
              {
                order: 9,
                video: {
                  type: 'video',
                  videoId: '7100557712198552837',
                  authorId: '@alalei77',
                },
                title: '',
                views: '578.2K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/63733adba193411eb9e73be6eedc6abf?x-expires=1653933600&x-signature=JlMcJbt3tQZOqRGYCDmMLvoGLJE%3D',
              },
              {
                order: 10,
                video: {
                  type: 'video',
                  videoId: '7100214378305211654',
                  authorId: '@alalei77',
                },
                title: '',
                views: '42.6K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/7551548e159b48eca2ec80e45d62ac1a?x-expires=1653933600&x-signature=e%2B9IXkhBKgTMBCcpqqKSipBAR6E%3D',
              },
              {
                order: 11,
                video: {
                  type: 'video',
                  videoId: '7100015139616722181',
                  authorId: '@alalei77',
                },
                title: '',
                views: '24K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/425e85b9067a4f828eb516c984cd7216?x-expires=1653933600&x-signature=x8BjhANQHGo5uLHUSgZ6KrKbUhQ%3D',
              },
              {
                order: 12,
                video: {
                  type: 'video',
                  videoId: '7099858135011101957',
                  authorId: '@alalei77',
                },
                title: '',
                views: '33.9K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/6b8c603fb114466888da446cccde0cd5?x-expires=1653933600&x-signature=05yVJ1w0ln2tUqDZz3rwSjlYEiw%3D',
              },
              {
                order: 13,
                video: {
                  type: 'video',
                  videoId: '7099548673268272389',
                  authorId: '@alalei77',
                },
                title: '',
                views: '44K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/86bff46cc99343618b664b6643437b2d?x-expires=1653933600&x-signature=RtoasbIawHxTKGIFstiMDba8UGU%3D',
              },
              {
                order: 14,
                video: {
                  type: 'video',
                  videoId: '7099470799354006790',
                  authorId: '@alalei77',
                },
                title: '',
                views: '59.1K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/8dd6f41c65a745fda88fa9da4c153f6c?x-expires=1653933600&x-signature=Zy0thv0CU3erfj6eDBJuduZNce4%3D',
              },
              {
                order: 15,
                video: {
                  type: 'video',
                  videoId: '7098753809236741382',
                  authorId: '@alalei77',
                },
                title: '',
                views: '39.1K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/c83ed2db28fe422d909716ce9f557e73?x-expires=1653933600&x-signature=K8bbx4AydbwGEh5qhhqNtV6RIcQ%3D',
              },
              {
                order: 16,
                video: {
                  type: 'video',
                  videoId: '7098733298062494981',
                  authorId: '@alalei77',
                },
                title: '',
                views: '23K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/9f5fde36af4d4eccaa2f6471786c6c7b?x-expires=1653933600&x-signature=4tM75vHWC16jYHlkv9ekUZ0%2FiFI%3D',
              },
              {
                order: 17,
                video: {
                  type: 'video',
                  videoId: '7097898684842609926',
                  authorId: '@alalei77',
                },
                title: '',
                views: '567.5K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/85d8149a504f484cba0ea682c0d97d09?x-expires=1653933600&x-signature=riAUyXWk9K9qtYu6thEGSk4BAg8%3D',
              },
              {
                order: 18,
                video: {
                  type: 'video',
                  videoId: '7097140879932148998',
                  authorId: '@alalei77',
                },
                title: '',
                views: '481.6K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/273a92e628b442bcb9c2d9c2c89296be?x-expires=1653933600&x-signature=sNlYzmDK0Mc83xBYi4Ub%2FcL9z4Q%3D',
              },
              {
                order: 19,
                video: {
                  type: 'video',
                  videoId: '7096461468702379269',
                  authorId: '@alalei77',
                },
                title: '',
                views: '55.7K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/1c7e7ce9b67a42748073f22c18195e52?x-expires=1653933600&x-signature=xspzi1OFmcQjkvJcb2UKj%2BWQjGs%3D',
              },
              {
                order: 20,
                video: {
                  type: 'video',
                  videoId: '7095816769855704325',
                  authorId: '@alalei77',
                },
                title: '',
                views: '69.1K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/791c397b778f49eca55b6ad329861c8e?x-expires=1653933600&x-signature=tmYwZn6Os6ufbesKJYn8ZptxxOA%3D',
              },
              {
                order: 21,
                video: {
                  type: 'video',
                  videoId: '7095651859733564678',
                  authorId: '@alalei77',
                },
                title: '',
                views: '46.5K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/673d4ae4c74b4d38b80761995364cefe?x-expires=1653933600&x-signature=QGPvY4LQFTC6O2uXGPrGKeX%2BFzY%3D',
              },
              {
                order: 22,
                video: {
                  type: 'video',
                  videoId: '7094889622223850758',
                  authorId: '@alalei77',
                },
                title: '',
                views: '42.4K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/3fae696b41a84771a1eac38520edd22d?x-expires=1653933600&x-signature=T1sNqSPiO5uFQGAtcN5xQDeklWg%3D',
              },
              {
                order: 23,
                video: {
                  type: 'video',
                  videoId: '7094547272049986821',
                  authorId: '@alalei77',
                },
                title: '',
                views: '46.2K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/fb77fb546f044cf7b1463ca093926cd8?x-expires=1653933600&x-signature=RCq1U52cndLAOLOqUzzy9LkVx5U%3D',
              },
              {
                order: 24,
                video: {
                  type: 'video',
                  videoId: '7094323554115767557',
                  authorId: '@alalei77',
                },
                title: '#sexywomen#sexylady #fyp #hotwomen #asiangirl #beauty',
                views: '59.2K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/c919d5fb300442588ad001ec55f562ec?x-expires=1653933600&x-signature=CbYSEmPOkAvt9YRbLsppt2W1FRo%3D',
              },
              {
                order: 25,
                video: {
                  type: 'video',
                  videoId: '7093887942262852869',
                  authorId: '@alalei77',
                },
                title: '',
                views: '37.9K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/acb11ec64edb47039a4aa3b2ab636c87?x-expires=1653933600&x-signature=N5jYj%2B4%2F5Vb%2FojZKo8P%2BSJk5NcE%3D',
              },
              {
                order: 26,
                video: {
                  type: 'video',
                  videoId: '7092750400465456389',
                  authorId: '@alalei77',
                },
                title: '',
                views: '39.8K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/45d93d4f842b430c8798cbf0cb2d31d8?x-expires=1653933600&x-signature=OFZV15GATfy2HvBFgsYIJjBR8V8%3D',
              },
              {
                order: 27,
                video: {
                  type: 'video',
                  videoId: '7092659346009492742',
                  authorId: '@alalei77',
                },
                title: '',
                views: '36.4K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/0d984d5565d949fdaa989e007943e94b?x-expires=1653933600&x-signature=rjLUV58%2F9ZyGKt9tIeE2xdcinrU%3D',
              },
              {
                order: 28,
                video: {
                  type: 'video',
                  videoId: '7092382189756681478',
                  authorId: '@alalei77',
                },
                title: '',
                views: '91.4K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/9d77f8310bf048198be20a34970f6bd7?x-expires=1653933600&x-signature=wRunP7rwZpDsCv4eKKpdI%2B0u9zc%3D',
              },
              {
                order: 29,
                video: {
                  type: 'video',
                  videoId: '7092292201673231622',
                  authorId: '@alalei77',
                },
                title: '',
                views: '33.4K',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/4beff9fe008343daa4b9efb340b31489?x-expires=1653933600&x-signature=r%2BUNM6ez%2BAAXylXFaUUT%2FXpt7MY%3D',
              },
              {
                order: 30,
                video: {
                  type: 'video',
                  videoId: '7091866313869626630',
                  authorId: '@alalei77',
                },
                title: '',
                views: '1.1M',
                thumbnail:
                  'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/9edec67287994eab92922618957fab30?x-expires=1653933600&x-signature=55EWwTClbPUzIDLC9F7rP1OwhCM%3D',
              },
            ],
            type: 'profile',
          }
        ],
      });
    });
  });
});
