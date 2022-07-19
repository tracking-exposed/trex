import { GuardoniExperimentArb } from '@shared/arbitraries/Experiment.arb';
import bs58 from '@shared/providers/bs58.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { sleep } from '@shared/utils/promise.utils';
import { ContributionEventArb } from '@yttrex/shared/arbitraries/ContributionEvent.arb';
import { pipe } from 'fp-ts/lib/function';
import * as fs from 'fs';
import * as path from 'path';
import {
  getLastHTMLs,
  HTMLSource,
  updateMetadataAndMarkHTML,
} from '../../lib/parser/html';
import {
  getLastLeaves,
  updateAdvertisingAndMetadata,
} from '../../lib/parser/leaf';
import { GetParserProvider } from '../../lib/parser/parser';
import { Leaf } from '../../models/Leaf';
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

      await GetParserProvider<Leaf>('leaves', {
        db,
        parsers: leafParsers,
        getContributions: getLastLeaves({ db }),
        getEntryDate: (e) => e.savingTime,
        getEntryNatureType: (e) => e.nature.type,
        saveResults: async (r) => {
          if (r) {
            await updateAdvertisingAndMetadata({ db })(r as any);
          }
          return null;
        },
      }).run({
        singleUse: true,
        stop: 1,
        repeat: false,
        backInTime: 10,
        htmlAmount: 10,
      });

      // run parser
      await GetParserProvider<HTMLSource>('htmls', {
        db,
        parsers: parsers,
        getContributions: getLastHTMLs({ db }),
        saveResults: updateMetadataAndMarkHTML({ db }),
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
      })
        .run({
          singleUse: true,
          stop: 1,
          htmlAmount: 100,
          backInTime: 10,
        })
        .then((r) => r.payload.metadata);

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
