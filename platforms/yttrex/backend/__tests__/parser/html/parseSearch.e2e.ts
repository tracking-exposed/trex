import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import nacl from 'tweetnacl';
import {
  addDom,
  getLastHTMLs,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import { SearchMetadataDB } from '../../../models/metadata/SearchMetadata';
import { HTMLSource, parsers } from '@yttrex/shared/parser';
import { toMetadata } from '@yttrex/shared/parser/metadata';
import { GetTest, Test } from '../../../tests/Test';
import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import path from 'path';
import { v4 as uuid } from 'uuid';

describe('Parser: Search', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  let db;
  beforeAll(async () => {
    appTest = await GetTest();
    db = {
      api: appTest.mongo3,
      read: appTest.mongo,
      write: appTest.mongo,
    };
  });

  afterEach(async () => {
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').htmls,
      {
        publicKey: {
          $eq: publicKey,
        },
      }
    );
    await appTest.mongo3.deleteMany(
      appTest.mongo,
      appTest.config.get('schema').metadata,
      {
        publicKey: {
          $eq: publicKey,
        },
      }
    );
  });

  jest.useRealTimers();

  jest.setTimeout(20 * 1000);

  const failingIds = ['4d7a3ad714a990974e4ea3ab153841857dd1f56b'];

  const historyData = readFixtureJSONPaths(
    path.resolve(__dirname, '../../fixtures/htmls/search'),
    {
      exclude: failingIds,
      // only: failingIds,
    }
  );

  test.each(historyData)(
    'Should correctly parse video contributions %s',
    async (fixturePath) => {
      const { sources: _sources, metadata } = readFixtureJSON(
        fixturePath,
        publicKey
      );
      const sources = _sources.map((h: any) => ({
        html: {
          ...h,
          id: uuid(),
          clientTime: parseISO(h.clientTime ?? new Date()),
          savingTime: subMinutes(new Date(), 1),
          processed: null,
        },
        supporter: undefined,
      }));

      await runParserTest({
        name: 'search-parser',
        log: appTest.logger,
        parsers: parsers,
        codecs: { contribution: HTMLSource, metadata: SearchMetadataDB },
        sourceSchema: getSourceSchema(),
        metadataSchema: getMetadataSchema(),
        addDom: addDom,
        db,
        getEntryId: (e) => e.html.id,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
        getContributions: getLastHTMLs(db),
        getMetadata: getMetadata(db),
        buildMetadata: toMetadata as any,
        saveResults: updateMetadataAndMarkHTML(db) as any,
        config: {},
        expectSources: (sources) => {
          sources.forEach((r: any) => {
            expect(r.processed).toBe(true);
          });
        },

        expectMetadata: (metadata, updatedMetadata) => {
          const {
            savingTime: _savingTime,
            clientTime: _clientTimeM,
            _id,
            id,
            results: _receivedResults,
            ...receivedMetadata
          } = metadata;

          const {
            htmls: _htmls,
            clientTime: _clientTimeNewM,
            results: _expectedResults,
            savingTime: _expectedSavingTime,
            id: _expectedId,
            _id: _expected_Id,
            ...expectedMetadata
          } = updatedMetadata as any;

          expect({
            ...receivedMetadata,
          }).toMatchObject({
            ...expectedMetadata,
          });

          expect(_receivedResults).toMatchObject(
            _expectedResults.map(({ secondsAgo, ...r }) => r)
          );
        },
      })({ sources, metadata });
    }
  );
});
