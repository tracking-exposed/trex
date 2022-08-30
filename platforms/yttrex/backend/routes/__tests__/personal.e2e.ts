import { GuardoniExperimentArb } from '@shared/arbitraries/Experiment.arb';
import bs58 from '@shared/providers/bs58.provider';
import { GetParserProvider } from '@shared/providers/parser.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { sleep } from '@shared/utils/promise.utils';
import { ContributionEventArb } from '@yttrex/shared/arbitraries/ContributionEvent.arb';
import { Ad } from '@yttrex/shared/models/Ad';
import { Metadata } from '@yttrex/shared/models/Metadata';
import { pipe } from 'fp-ts/lib/function';
import * as fs from 'fs';
import * as path from 'path';
import {
  getLastHTMLs,
  HTMLSource,
  toMetadata as toHTMLMetadata,
  updateMetadataAndMarkHTML,
} from '../../lib/parser/html';
import {
  getLastLeaves,
  LeafSource,
  toMetadata as toAdMetadata,
  updateAdvertisingAndMetadata,
} from '../../lib/parser/leaf';
import { leafParsers, parsers } from '../../parsers';
import { GetTest, Test } from '../../tests/Test';

const version = '9.9.9.9';
describe('Events', () => {
  let appTest: Test;
  const [experiment] = fc.sample(GuardoniExperimentArb, 1);

  beforeAll(async () => {
    appTest = await GetTest();
    await appTest.mongo3.insertMany(
      appTest.mongo,
      appTest.config.get('schema').experiments,
      [experiment]
    );
  });

  afterAll(async () => {
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').experiments,
      { experimentId: experiment.experimentId }
    );
    await appTest.mongo.close();
  });

  jest.setTimeout(20 * 1000);

  describe('GetPersonalByExperimentId', () => {
    test('succeeds with one metadata', async () => {
      const researchTag = 'test-tag';

      const keys = await foldTEOrThrow(bs58.makeKeypair(''));

      const fixture = pipe(
        fs.readFileSync(
          path.resolve(
            __dirname,
            '../../__tests__/fixtures/home/53e13320d4e8c525fd00ce54e12fbadcbc54f8b0.json'
          ),
          'utf-8'
        ),
        JSON.parse
      );

      const data = fc.sample(ContributionEventArb, 1).map((d) => ({
        ...d,
        ...fixture.sources[0],
        experimentId: experiment.experimentId,
        researchTag,
      }));

      // create a signature
      const signature = await foldTEOrThrow(
        bs58.makeSignature(JSON.stringify(data), keys.secretKey)
      );

      // send events
      await appTest.app
        .post(`/api/v2/events`)
        .set('x-yttrex-version', version)
        .set('x-yttrex-build', '')
        .set('X-yttrex-publicKey', keys.publicKey)
        .set('x-yttrex-signature', signature)
        .set('x-yttrex-nonAuthCookieId', 'local')
        .set('accept-language', 'en')
        .send(data)
        .expect(200);

      const db = {
        api: appTest.mongo3,
        read: appTest.mongo,
        write: appTest.mongo,
      };

      await GetParserProvider('leaves', {
        db,
        parsers: leafParsers,
        codecs: {
          contribution: LeafSource,
          metadata: Ad,
        },
        getEntryId: (e) => e.html.id,
        getContributions: getLastLeaves(db),
        getEntryDate: (e) => e.html.savingTime,
        buildMetadata: toAdMetadata,
        getEntryNatureType: (e) => e.html.nature.type,
        saveResults: updateAdvertisingAndMetadata(db),
      }).run({
        singleUse: true,
        stop: 1,
        repeat: false,
        backInTime: 10,
        htmlAmount: 10,
      });

      // run parser
      await GetParserProvider('htmls', {
        db,
        parsers: parsers,
        codecs: {
          contribution: HTMLSource,
          metadata: Metadata,
        },
        getEntryId: (e) => e.html.id,
        buildMetadata: toHTMLMetadata,
        getContributions: getLastHTMLs(db),
        saveResults: updateMetadataAndMarkHTML(db),
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
      }).run({
        singleUse: true,
        stop: 1,
        htmlAmount: 100,
        backInTime: 10,
      });

      // wait for the parser to process the html
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
            href: 'https://www.youtube.com/',
            publicKey: keys.publicKey,
            clientTime: fixture.sources[0].clientTime,
            experimentId: experiment.experimentId,
            type: 'home',
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
});
