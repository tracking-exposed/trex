import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { JSDOM } from 'jsdom';
import nacl from 'tweetnacl';
import {
  getLastHTMLs,
  HTMLSource,
  toMetadata,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import { SearchMetadata } from '@yttrex/shared/models/Metadata';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { processSearch } from '../../../parsers/searches';
import { GetTest, Test } from '../../../tests/Test';
import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import path from 'path';

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

  const historyData = readFixtureJSONPaths(
    path.resolve(__dirname, '../../fixtures/search')
  );

  /**
   * TODO:
   *
   * historyData[1] has an issue time formatting for `publication`
   * historyData[3] has an issue time formatting for `publication`
   * historyData[7] has an issue time formatting for `publication`
   * historyData[8] has an issue time formatting for `publication`
   * historyData[9] has an issue with `related` property
   * historyData[10] has an issue time formatting for `publication`
   */

  test.each([
    historyData[0],
    historyData[2],
    historyData[5],
    historyData[11],
  ])('Should correctly parse video contributions', async (fixturePath) => {
    const { sources: _sources, metadata } = readFixtureJSON(
      fixturePath,
      publicKey
    );
    const sources = _sources.map((h: any) => ({
      html: {
        ...h,
        clientTime: parseISO(h.clientTime ?? new Date()),
        savingTime: subMinutes(new Date(), 1),
        processed: null,
      },
      jsdom: new JSDOM(sanitizeHTML(h.html)).window.document,
      supporter: undefined,
    }));

    await runParserTest({
      log: appTest.logger,
      parsers: { nature: processSearch },
      codecs: { contribution: HTMLSource, metadata: SearchMetadata },
      sourceSchema: appTest.config.get('schema').htmls,
      metadataSchema: appTest.config.get('schema').metadata,
      db,
      getEntryId: (e) => e.html.id,
      getEntryDate: (e) => e.html.savingTime,
      getEntryNatureType: (e) => e.html.nature.type,
      getContributions: getLastHTMLs(db),
      buildMetadata: toMetadata as any,
      saveResults: updateMetadataAndMarkHTML(db) as any,
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

        expect(
          _receivedResults.map(({ secondsAgo, ...r }: any) => ({
            ...r,
            published: r.published
              .replace(/\d{1}\s(year)$/gi, 'a year')
              .replace(/\d{1}\s(month)$/gi, 'a month')
              .replace(/\d{1}\s(day)$/gi, 'a day')
              .replace(/\d{1}\s(hour)$/gi, 'an hour')
              .replace(/\d{1}\s(minute)$/gi, 'a minute'),
          }))
        ).toMatchObject(_expectedResults.map(({ secondsAgo, ...r }) => r));
      },
    })({ sources, metadata });
  });
});
