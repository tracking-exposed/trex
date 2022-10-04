import { GetTest, Test } from '../../tests/Test';

import { GuardoniExperimentArb } from '@shared/arbitraries/Experiment.arb';
import bs58 from '@shared/providers/bs58.provider';
import {
  GetParserProvider,
  ParserProviderContextDB,
} from '@shared/providers/parser.provider';
import { fc } from '@shared/test';
import { foldTEOrThrow } from '@shared/utils/fp.utils';
import { sleep } from '@shared/utils/promise.utils';
import { Ad } from '@yttrex/shared/models/Ad';
import { Metadata } from '@yttrex/shared/models/Metadata';
import { pipe } from 'fp-ts/lib/function';
import * as fs from 'fs';
import { parserConfig } from '@yttrex/shared/parser/config';
import * as path from 'path';
import {
  addDom as addDOMToHTML,
  getLastHTMLs,
  getMetadata as getHTMLMetadata,
  updateMetadataAndMarkHTML,
} from '../../lib/parser/html';
import { toMetadata as toHTMLMetadata } from '@yttrex/shared/parser/metadata';
import {
  addDom as addDomToLeaf,
  getLastLeaves,
  getMetadata as getAdMetadata,
  toMetadata as toAdMetadata,
  updateAdvertisingAndMetadata,
} from '../../lib/parser/leaf';
import {
  leafParsers,
  parsers,
  LeafSource,
  HTMLSource,
} from '@yttrex/shared/parser';

const pkgJSON = require('../../package.json');

const version = pkgJSON.version;
describe('Events', () => {
  let appTest: Test, db: ParserProviderContextDB;
  const [experiment] = fc.sample(GuardoniExperimentArb, 1);

  beforeAll(async () => {
    appTest = await GetTest();
    await appTest.mongo3.insertMany(
      appTest.mongo,
      appTest.config.get('schema').experiments,
      [experiment]
    );

    db = {
      api: appTest.mongo3,
      read: appTest.mongo,
      write: appTest.mongo,
    };
  });

  afterAll(async () => {
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').experiments,
      { experimentId: experiment.experimentId }
    );
    await appTest.mongo.close();
  });

  jest.setTimeout(30 * 1000);

  describe('GetPersonalByExperimentId', () => {
    test('succeeds with one metadata', async () => {
      const researchTag = 'test-tag';
      const clientTime = new Date().toISOString();
      const keys = await foldTEOrThrow(bs58.makeKeypair(''));

      const fixture = pipe(
        fs.readFileSync(
          path.resolve(
            __dirname,
            '../../__tests__/fixtures/htmls/home/53e13320d4e8c525fd00ce54e12fbadcbc54f8b0.json'
          ),
          'utf-8'
        ),
        JSON.parse
      );

      const [{ savingTime, processed, html, id, ...source }] = fixture.sources;

      const data = [
        {
          ...source,
          type: 'home',
          element: html,
          publicKey: keys.publicKey,
          clientTime,
          savingTime: clientTime,
          experimentId: experiment.experimentId,
          researchTag,
        },
      ];

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

      const { id: sourceId } = await db.api.readOne(
        db.read,
        appTest.config.get('schema').htmls,
        {
          publicKey: {
            $eq: keys.publicKey,
          },
        },
        {}
      );

      await GetParserProvider('leaves', {
        db,
        parsers: leafParsers,
        codecs: {
          contribution: LeafSource,
          metadata: Ad,
        },
        addDom: addDomToLeaf,
        getEntryId: (e) => e.html.id,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
        getContributions: getLastLeaves(db),
        getMetadata: getAdMetadata(db),
        buildMetadata: toAdMetadata,
        saveResults: updateAdvertisingAndMetadata(db),
        config: parserConfig,
      }).run({
        singleUse: true,
        stop: 1,
        repeat: false,
        backInTime: 10,
        htmlAmount: 1,
      });

      // run parser
      await GetParserProvider('htmls', {
        db,
        parsers: parsers,
        codecs: {
          contribution: HTMLSource,
          metadata: Metadata,
        },
        addDom: addDOMToHTML,
        getEntryId: (e) => e.html.id,
        getMetadata: getHTMLMetadata(db),
        buildMetadata: toHTMLMetadata,
        getContributions: getLastHTMLs(db),
        saveResults: updateMetadataAndMarkHTML(db),
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
        config: parserConfig,
      }).run({
        singleUse: sourceId,
        stop: 1,
        htmlAmount: 1,
        backInTime: 10,
      });

      // wait for the parser to process the html
      await sleep(10 * 1000);

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
            clientTime,
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

      await appTest.mongo3.deleteMany(
        appTest.mongo,
        appTest.config.get('schema').metadata,
        { publicKey: keys.publicKey }
      );
    });
  });
});
