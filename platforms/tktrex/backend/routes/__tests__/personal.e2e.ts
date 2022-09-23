import { GuardoniExperimentArb } from '@shared/arbitraries/Experiment.arb';
import { Keypair } from '@shared/models/extension/Keypair';
import bs58 from '@shared/providers/bs58.provider';
import {
  GetParserProvider,
  ParserProvider
} from '@shared/providers/parser.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { sleep } from '@shared/utils/promise.utils';
import { ContributionEventArb } from '@tktrex/shared/arbitraries/ContributionEvent.arb';
import { TKMetadata } from '@tktrex/shared/models/Metadata';
import { parsers } from '@tktrex/shared/parser';
import { HTMLSource } from '@tktrex/shared/parser/source';
import {
  addDom,
  buildMetadata,
  getLastHTMLs,
  getMetadata,
  updateMetadataAndMarkHTML
} from '../../lib/parser';
import { GetTest, Test } from '../../test/Test';

const version = '9.9.9.9';
const researchTag = 'test-research-tag';
let keys: Keypair;

describe('/v2/personal', () => {
  let appTest: Test;
  const [experiment] = fc.sample(GuardoniExperimentArb, 1);
  let parserProvider: ParserProvider<
    HTMLSource,
    TKMetadata,
    any,
    typeof parsers
  > = beforeAll(async () => {
    appTest = await GetTest();
    await appTest.mongo3.insertMany(
      appTest.mongo,
      appTest.config.get('schema').experiments,
      [experiment]
    );
    keys = await foldTEOrThrow(bs58.makeKeypair(''));
    const db = {
      write: appTest.mongo,
      read: appTest.mongo,
      api: appTest.mongo3,
    };
    parserProvider = GetParserProvider('html', {
      db,
      config: {},
      parsers: parsers,
      codecs: {
        contribution: HTMLSource,
        metadata: TKMetadata,
      },
      addDom,
      getEntryId: (e) => e.html.id,
      getContributions: getLastHTMLs(db),
      getMetadata: getMetadata(db),
      getEntryDate: (e) => e.html.savingTime,
      getEntryNatureType: (e) => e.html.type,
      buildMetadata: buildMetadata,
      saveResults: updateMetadataAndMarkHTML(db),
    });
  });

  afterAll(async () => {
    await appTest.mongo.close();
  });

  jest.setTimeout(20 * 1000);

  describe('GetPersonalByExperimentId', () => {
    test('succeeds with one metadata', async () => {
      const data = fc.sample(ContributionEventArb, 1).map((d) => ({
        ...d,
        type: 'video',
        rect: {
          x: 0,
          y: 0,
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
        },
        href: 'https://tiktok.com/foryou',
        timelineId: 'meyerlemon-58ea70409b',
        clientTime: '2022-05-30T13:59:41.603Z',
        html: '<div data-e2e="recommend-list-item-container" class="tiktok-1p48f7x-DivItemContainer e1eulw5o0" trex="1">\n              <a class="avatar-anchor tiktok-1tizhk9 e1eulw5o4" data-e2e="video-author-avatar" href="/@yuuna_1210"><div class="tiktok-uha12h-DivContainer e1vl87hj1" style="width: 56px; height: 56px">\n                  <span shape="circle" style="width: 56px; height: 56px" class="e1vl87hj2 tiktok-gigx3u-SpanAvatarContainer-StyledAvatar e1e9er4e0"><img loading="lazy" src="https://p77-sign-sg.tiktokcdn.com/aweme/100x100/tos-alisg-avt-0068/9c599d46a1dea2f18159b666b75c279a.jpeg?x-expires=1647352800&amp;x-signature=MnkUc95nRZ6rxv3TUNlJeZlQba4%3D" class="tiktok-1zpj2q-ImgAvatar e1e9er4e1"></span></div></a>\n              <div class="tiktok-10gdph9-DivContentContainer e1eulw5o1">\n                <div class="tiktok-1hhj6ie-DivTextInfoContainer e1eulw5o7">\n                  <div class="tiktok-1mnwhn0-DivAuthorContainer e1eulw5o6">\n                    <a class="avatar-anchor tiktok-1tizhk9 e1eulw5o4" href="/@yuuna_1210"><div class="tiktok-uha12h-DivContainer e1vl87hj1" style="width: 40px; height: 40px">\n                        <span shape="circle" style="width: 40px; height: 40px" class="e1vl87hj2 tiktok-gigx3u-SpanAvatarContainer-StyledAvatar e1e9er4e0"><img loading="lazy" src="https://p77-sign-sg.tiktokcdn.com/aweme/100x100/tos-alisg-avt-0068/9c599d46a1dea2f18159b666b75c279a.jpeg?x-expires=1647352800&amp;x-signature=MnkUc95nRZ6rxv3TUNlJeZlQba4%3D" class="tiktok-1zpj2q-ImgAvatar e1e9er4e1"></span></div></a><a class="tiktok-12dba99-StyledAuthorAnchor e10yw27c1" href="/@yuuna_1210"><h3 data-e2e="video-author-uniqueid" class="tiktok-debnpy-H3AuthorTitle e10yw27c0">\n                        yuuna_1210\n                      </h3>\n                      <h4 data-e2e="video-author-nickname" class="tiktok-7uj1aq-H4AuthorName e10yw27c2">\n                        悠那🌹🌕\n                      </h4></a>\n                  </div>\n                  <button type="button" data-e2e="feed-follow" class="e1v1ai9g0 tiktok-jcprrh-Button-StyledFollowButton ehk74z00">\n                    Follow\n                  </button>\n                  <div data-e2e="video-desc" class="tiktok-1ejylhp-DivContainer e11995xo0">\n                    <span class="tiktok-j2a19r-SpanText e37luzl0">🌹🌕</span><a href="/tag/おすすめ"><strong class="tiktok-f9vo34-StrongText e11995xo1">#おすすめ\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"> </span><a href="/tag/コスプレ"><strong class="tiktok-f9vo34-StrongText e11995xo1">#コスプレ\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"> </span><a href="/tag/制服"><strong class="tiktok-f9vo34-StrongText e11995xo1">#制服\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"></span>\n                  </div>\n                  <h4 data-e2e="video-music" class="tiktok-9y3z7x-H4Link e1wg6xq70">\n                    <a href="/music/TJR-Eat-God-See-Acid-Noslek-Milkshake-Edit-7036689888661506817"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" class="tiktok-812w79-SvgIcon e1wg6xq71">\n                        <use xlink:href="#svg-music-note"></use></svg>TJR Eat God See Acid Noslek Milkshake Edit - Даба\n                      Дамбиев</a>\n                  </h4>\n                </div>\n                <div class="tiktok-kd7foj-DivVideoWrapper e1cpsqt16">\n                  <div data-e2e="feed-video" class="tiktok-1lh5noh-DivVideoCardContainer e1cpsqt7">\n                    <canvas width="56.25" height="100" class="tiktok-196h150-CanvasVideoCardPlaceholder e1cpsqt0"></canvas>\n                    <div class="tiktok-1031u32-DivVideoPlayerContainer e1cpsqt15">\n                      <div mode="0" class="tiktok-yf3ohr-DivContainer e1yey0rl0">\n                        <img mode="0" src="https://p16-sign-sg.tiktokcdn.com/obj/tos-alisg-p-0037/b43298e3b41f40589bfe2dc42b8879ab?x-expires=1647288000&amp;x-signature=SLK%2B9qM66zdUmmmaGYzIebllNRU%3D" alt="🌹🌕#おすすめ #コスプレ #制服" loading="lazy" class="tiktok-1itcwxg-ImgPoster e1yey0rl1">\n                        <div class="tiktok-1h63bmc-DivBasicPlayerWrapper e1yey0rl2">\n                          <video src="https://v16-webapp.tiktok.com/c7c10be94d72ed6faf7bc46084f1e229/622fa563/video/tos/alisg/tos-alisg-pve-0037/022f40cc294d4c318619e4132287df4b/?a=1988&amp;br=3234&amp;bt=1617&amp;cd=0%7C0%7C1%7C0&amp;ch=0&amp;cr=0&amp;cs=0&amp;cv=1&amp;dr=0&amp;ds=3&amp;er=&amp;ft=XOQ9-3D_nz7ThYKEvDXq&amp;l=20220314142809010223083026242147EA&amp;lr=tiktok&amp;mime_type=video_mp4&amp;net=0&amp;pl=0&amp;qs=0&amp;rc=M3RwMzU6Zm00OzMzODgzNEApOzk1aTtpZmVnN2Y3NjM5aGczMmRfcjQwZmlgLS1kLy1zczE1My80MzVeXmBhMF4wNC86Yw%3D%3D&amp;vl=&amp;vr=" playsinline="" autoplay="" class="tiktok-lkdalv-VideoBasic e1yey0rl4"></video>\n                        </div>\n                      </div>\n                      <div data-e2e="video-play" class="tiktok-mlcjt3-DivPlayIconContainer-StyledDivPlayIconContainer e1cpsqt9">\n                        <svg width="20" height="20" viewBox="0 0 48 48" fill="#fff" xmlns="http://www.w3.org/2000/svg">\n                          <path d="M8 6C8 5.44771 8.44772 5 9 5H17C17.5523 5 18 5.44772 18 6V42C18 42.5523 17.5523 43 17 43H9C8.44772 43 8 42.5523 8 42V6Z"></path>\n                          <path d="M30 6C30 5.44771 30.4477 5 31 5H39C39.5523 5 40 5.44772 40 6V42C40 42.5523 39.5523 43 39 43H31C30.4477 43 30 42.5523 30 42V6Z"></path>\n                        </svg>\n                      </div>\n                      <div class="tiktok-q09c19-DivVoiceControlContainer e1cpsqt12">\n                        <div data-e2e="video-sound" class="tiktok-1vkl2c4-DivMuteIconContainer e1cpsqt11">\n                          <svg width="24" height="24" viewBox="0 0 48 48" fill="#fff" xmlns="http://www.w3.org/2000/svg">\n                            <path fill-rule="evenodd" clip-rule="evenodd" d="M25 10.8685C25 8.47242 22.3296 7.04325 20.3359 8.37236L10.3944 15H6C4.34315 15 3 16.3431 3 18V30C3 31.6568 4.34314 33 6 33H10.3944L20.3359 39.6276C22.3296 40.9567 25 39.5276 25 37.1315V10.8685ZM29.2929 18.1213L35.1716 24L29.2929 29.8787C28.9024 30.2692 28.9024 30.9024 29.2929 31.2929L30.7071 32.7071C31.0976 33.0976 31.7308 33.0976 32.1213 32.7071L38 26.8284L43.8787 32.7071C44.2692 33.0976 44.9024 33.0976 45.2929 32.7071L46.7071 31.2929C47.0976 30.9024 47.0976 30.2692 46.7071 29.8787L40.8284 24L46.7071 18.1213C47.0976 17.7308 47.0976 17.0976 46.7071 16.7071L45.2929 15.2929C44.9024 14.9024 44.2692 14.9024 43.8787 15.2929L38 21.1716L32.1213 15.2929C31.7308 14.9024 31.0976 14.9024 30.7071 15.2929L29.2929 16.7071C28.9024 17.0976 28.9024 17.7308 29.2929 18.1213Z"></path>\n                          </svg>\n                        </div>\n                      </div>\n                      <div class="tiktok-fxqf0v-DivVideoControlBottom e1v0lko10"></div>\n                      <p data-e2e="video-report" class="tiktok-czl35e-PReportText e1cpsqt13">\n                        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="tiktok-plwc8a-SvgIconFlag e1cpsqt14">\n                          <use xlink:href="#svg-flag"></use></svg>Report\n                      </p>\n                    </div>\n                  </div>\n                  <div class="tiktok-wc6k4c-DivActionItemContainer e1e0ediu0">\n                    <button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="like-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24">\n                          <use xlink:href="#svg-heart-fill"></use></svg></span><strong data-e2e="like-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">10K</strong></button><button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="comment-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n                          <use xlink:href="#svg-ellipsis-right-fill"></use></svg></span><strong data-e2e="comment-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">236</strong></button><button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="share-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg width="24" height="24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">\n                          <use xlink:href="#svg-pc-share"></use></svg></span><strong data-e2e="share-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">167</strong>\n                    </button>\n                  </div>\n                </div>\n              </div>\n            </div>',
        feedCounter: 1,
        feedId: 'feed-id',
        videoCounter: 1,
        geoip: null,
        experimentId: experiment.experimentId,
      }));

      // create a signature
      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(data), keys.secretKey)
      );

      // send events
      await appTest.app
        .post(`/api/v2/events`)
        .set('x-tktrex-version', version)
        .set('X-tktrex-publicKey', keys.publicKey)
        .set('x-tktrex-signature', signature)
        .set('x-tktrex-nonauthcookieid', researchTag)
        .send(data)
        .expect(200);

      // wait for the parser to process the html

      await parserProvider.run({
        singleUse: true,
        stop: 1,
        repeat: false,
        backInTime: 10,
        htmlAmount: 10,
      });

      await sleep(5 * 1000);

      // check data has been produced
      const response = await appTest.app.get(
        `/api/v2/personal/${keys.publicKey}/experiments/${experiment.experimentId}/json`
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        supporter: {
          publicKey: keys.publicKey,
        },
        metadata: [
          {
            author: {
              link: '/@yuuna_1210',
              name: '悠那🌹🌕',
              username: 'yuuna_1210',
            },
            baretext: '🌹🌕',
            description: '🌹🌕#おすすめ #コスプレ #制服',
            experimentId: experiment.experimentId,
            hashtags: ['#おすすめ', '#コスプレ', '#制服'],
            metrics: {
              commentn: '236',
              liken: '10K',
              sharen: '167',
            },
            order: 1,
          },
        ],
      });

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').htmls,
        { publicKey: keys.publicKey }
      );
    });
  });

  describe('GET /v3/personal/:publicKey/native/json', () => {
    test('succeeds with one "native" metadata', async () => {
      const authorId = `@user`;
      const videoId = `111111111111`;
      const data = fc.sample(ContributionEventArb, 1).map((d) => ({
        ...d,
        type: 'native',
        rect: {
          x: 0,
          y: 0,
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
        },
        href: `https://tiktok.com/${authorId}/video/${videoId}`,
        clientTime: '2022-05-30T13:59:41.603Z',
        html: '<div data-e2e="recommend-list-item-container" class="tiktok-1p48f7x-DivItemContainer e1eulw5o0" trex="1">\n              <a class="avatar-anchor tiktok-1tizhk9 e1eulw5o4" data-e2e="video-author-avatar" href="/@yuuna_1210"><div class="tiktok-uha12h-DivContainer e1vl87hj1" style="width: 56px; height: 56px">\n                  <span shape="circle" style="width: 56px; height: 56px" class="e1vl87hj2 tiktok-gigx3u-SpanAvatarContainer-StyledAvatar e1e9er4e0"><img loading="lazy" src="https://p77-sign-sg.tiktokcdn.com/aweme/100x100/tos-alisg-avt-0068/9c599d46a1dea2f18159b666b75c279a.jpeg?x-expires=1647352800&amp;x-signature=MnkUc95nRZ6rxv3TUNlJeZlQba4%3D" class="tiktok-1zpj2q-ImgAvatar e1e9er4e1"></span></div></a>\n              <div class="tiktok-10gdph9-DivContentContainer e1eulw5o1">\n                <div class="tiktok-1hhj6ie-DivTextInfoContainer e1eulw5o7">\n                  <div class="tiktok-1mnwhn0-DivAuthorContainer e1eulw5o6">\n                    <a class="avatar-anchor tiktok-1tizhk9 e1eulw5o4" href="/@yuuna_1210"><div class="tiktok-uha12h-DivContainer e1vl87hj1" style="width: 40px; height: 40px">\n                        <span shape="circle" style="width: 40px; height: 40px" class="e1vl87hj2 tiktok-gigx3u-SpanAvatarContainer-StyledAvatar e1e9er4e0"><img loading="lazy" src="https://p77-sign-sg.tiktokcdn.com/aweme/100x100/tos-alisg-avt-0068/9c599d46a1dea2f18159b666b75c279a.jpeg?x-expires=1647352800&amp;x-signature=MnkUc95nRZ6rxv3TUNlJeZlQba4%3D" class="tiktok-1zpj2q-ImgAvatar e1e9er4e1"></span></div></a><a class="tiktok-12dba99-StyledAuthorAnchor e10yw27c1" href="/@yuuna_1210"><h3 data-e2e="video-author-uniqueid" class="tiktok-debnpy-H3AuthorTitle e10yw27c0">\n                        yuuna_1210\n                      </h3>\n                      <h4 data-e2e="video-author-nickname" class="tiktok-7uj1aq-H4AuthorName e10yw27c2">\n                        悠那🌹🌕\n                      </h4></a>\n                  </div>\n                  <button type="button" data-e2e="feed-follow" class="e1v1ai9g0 tiktok-jcprrh-Button-StyledFollowButton ehk74z00">\n                    Follow\n                  </button>\n                  <div data-e2e="video-desc" class="tiktok-1ejylhp-DivContainer e11995xo0">\n                    <span class="tiktok-j2a19r-SpanText e37luzl0">🌹🌕</span><a href="/tag/おすすめ"><strong class="tiktok-f9vo34-StrongText e11995xo1">#おすすめ\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"> </span><a href="/tag/コスプレ"><strong class="tiktok-f9vo34-StrongText e11995xo1">#コスプレ\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"> </span><a href="/tag/制服"><strong class="tiktok-f9vo34-StrongText e11995xo1">#制服\n                        <!-- --></strong></a><span class="tiktok-j2a19r-SpanText e37luzl0"></span>\n                  </div>\n                  <h4 data-e2e="video-music" class="tiktok-9y3z7x-H4Link e1wg6xq70">\n                    <a href="/music/TJR-Eat-God-See-Acid-Noslek-Milkshake-Edit-7036689888661506817"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" class="tiktok-812w79-SvgIcon e1wg6xq71">\n                        <use xlink:href="#svg-music-note"></use></svg>TJR Eat God See Acid Noslek Milkshake Edit - Даба\n                      Дамбиев</a>\n                  </h4>\n                </div>\n                <div class="tiktok-kd7foj-DivVideoWrapper e1cpsqt16">\n                  <div data-e2e="feed-video" class="tiktok-1lh5noh-DivVideoCardContainer e1cpsqt7">\n                    <canvas width="56.25" height="100" class="tiktok-196h150-CanvasVideoCardPlaceholder e1cpsqt0"></canvas>\n                    <div class="tiktok-1031u32-DivVideoPlayerContainer e1cpsqt15">\n                      <div mode="0" class="tiktok-yf3ohr-DivContainer e1yey0rl0">\n                        <img mode="0" src="https://p16-sign-sg.tiktokcdn.com/obj/tos-alisg-p-0037/b43298e3b41f40589bfe2dc42b8879ab?x-expires=1647288000&amp;x-signature=SLK%2B9qM66zdUmmmaGYzIebllNRU%3D" alt="🌹🌕#おすすめ #コスプレ #制服" loading="lazy" class="tiktok-1itcwxg-ImgPoster e1yey0rl1">\n                        <div class="tiktok-1h63bmc-DivBasicPlayerWrapper e1yey0rl2">\n                          <video src="https://v16-webapp.tiktok.com/c7c10be94d72ed6faf7bc46084f1e229/622fa563/video/tos/alisg/tos-alisg-pve-0037/022f40cc294d4c318619e4132287df4b/?a=1988&amp;br=3234&amp;bt=1617&amp;cd=0%7C0%7C1%7C0&amp;ch=0&amp;cr=0&amp;cs=0&amp;cv=1&amp;dr=0&amp;ds=3&amp;er=&amp;ft=XOQ9-3D_nz7ThYKEvDXq&amp;l=20220314142809010223083026242147EA&amp;lr=tiktok&amp;mime_type=video_mp4&amp;net=0&amp;pl=0&amp;qs=0&amp;rc=M3RwMzU6Zm00OzMzODgzNEApOzk1aTtpZmVnN2Y3NjM5aGczMmRfcjQwZmlgLS1kLy1zczE1My80MzVeXmBhMF4wNC86Yw%3D%3D&amp;vl=&amp;vr=" playsinline="" autoplay="" class="tiktok-lkdalv-VideoBasic e1yey0rl4"></video>\n                        </div>\n                      </div>\n                      <div data-e2e="video-play" class="tiktok-mlcjt3-DivPlayIconContainer-StyledDivPlayIconContainer e1cpsqt9">\n                        <svg width="20" height="20" viewBox="0 0 48 48" fill="#fff" xmlns="http://www.w3.org/2000/svg">\n                          <path d="M8 6C8 5.44771 8.44772 5 9 5H17C17.5523 5 18 5.44772 18 6V42C18 42.5523 17.5523 43 17 43H9C8.44772 43 8 42.5523 8 42V6Z"></path>\n                          <path d="M30 6C30 5.44771 30.4477 5 31 5H39C39.5523 5 40 5.44772 40 6V42C40 42.5523 39.5523 43 39 43H31C30.4477 43 30 42.5523 30 42V6Z"></path>\n                        </svg>\n                      </div>\n                      <div class="tiktok-q09c19-DivVoiceControlContainer e1cpsqt12">\n                        <div data-e2e="video-sound" class="tiktok-1vkl2c4-DivMuteIconContainer e1cpsqt11">\n                          <svg width="24" height="24" viewBox="0 0 48 48" fill="#fff" xmlns="http://www.w3.org/2000/svg">\n                            <path fill-rule="evenodd" clip-rule="evenodd" d="M25 10.8685C25 8.47242 22.3296 7.04325 20.3359 8.37236L10.3944 15H6C4.34315 15 3 16.3431 3 18V30C3 31.6568 4.34314 33 6 33H10.3944L20.3359 39.6276C22.3296 40.9567 25 39.5276 25 37.1315V10.8685ZM29.2929 18.1213L35.1716 24L29.2929 29.8787C28.9024 30.2692 28.9024 30.9024 29.2929 31.2929L30.7071 32.7071C31.0976 33.0976 31.7308 33.0976 32.1213 32.7071L38 26.8284L43.8787 32.7071C44.2692 33.0976 44.9024 33.0976 45.2929 32.7071L46.7071 31.2929C47.0976 30.9024 47.0976 30.2692 46.7071 29.8787L40.8284 24L46.7071 18.1213C47.0976 17.7308 47.0976 17.0976 46.7071 16.7071L45.2929 15.2929C44.9024 14.9024 44.2692 14.9024 43.8787 15.2929L38 21.1716L32.1213 15.2929C31.7308 14.9024 31.0976 14.9024 30.7071 15.2929L29.2929 16.7071C28.9024 17.0976 28.9024 17.7308 29.2929 18.1213Z"></path>\n                          </svg>\n                        </div>\n                      </div>\n                      <div class="tiktok-fxqf0v-DivVideoControlBottom e1v0lko10"></div>\n                      <p data-e2e="video-report" class="tiktok-czl35e-PReportText e1cpsqt13">\n                        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="tiktok-plwc8a-SvgIconFlag e1cpsqt14">\n                          <use xlink:href="#svg-flag"></use></svg>Report\n                      </p>\n                    </div>\n                  </div>\n                  <div class="tiktok-wc6k4c-DivActionItemContainer e1e0ediu0">\n                    <button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="like-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24">\n                          <use xlink:href="#svg-heart-fill"></use></svg></span><strong data-e2e="like-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">10K</strong></button><button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="comment-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n                          <use xlink:href="#svg-ellipsis-right-fill"></use></svg></span><strong data-e2e="comment-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">236</strong></button><button type="button" class="tiktok-1xiuanb-ButtonActionItem e1bs7gq20">\n                      <span data-e2e="share-icon" class="tiktok-ouggfm-SpanIconWrapper e1bs7gq21"><svg width="24" height="24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">\n                          <use xlink:href="#svg-pc-share"></use></svg></span><strong data-e2e="share-count" class="tiktok-1y2yo26-StrongText e1bs7gq22">167</strong>\n                    </button>\n                  </div>\n                </div>\n              </div>\n            </div>',
        feedCounter: 1,
        feedId: 'native-feed-id',
        videoCounter: 1,
        geoip: null,
        experimentId: experiment.experimentId,
      }));

      // create a signature
      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(data), keys.secretKey)
      );

      // send events
      await appTest.app
        .post(`/api/v2/events`)
        .set('x-tktrex-version', version)
        .set('X-tktrex-publicKey', keys.publicKey)
        .set('x-tktrex-signature', signature)
        .set('x-tktrex-nonauthcookieid', researchTag)
        .send(data)
        .expect(200);

      await parserProvider.run({
        singleUse: true,
        repeat: false,
        stop: 1,
        htmlAmount: 10,
        backInTime: 2,
      });

      // check data has been produced
      const response = await appTest.app.get(
        `/api/v2/personal/${keys.publicKey}/native/json`
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        counters: {
          metadata: 1,
        },
        metadata: [
          {
            type: 'native',
            authorId,
            videoId,
            nature: { type: 'native', authorId, videoId },
            order: 1,
          },
        ],
      });
    });
  });
});
