import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { JSDOM } from 'jsdom';
import nacl from 'tweetnacl';
import {
  getLastHTMLs,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import { SearchMetadata } from '../../../models/Metadata';
import process from '../../../parsers/searches';
import { GetTest, Test } from '../../../tests/Test';
import { readHistoryResults, runParserTest } from './utils';

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

  const historyData = readHistoryResults('search', publicKey);

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
    historyData[4],
    historyData[5],
    historyData[6],
    historyData[11],
  ])(
    'Should correctly parse video contributions',
    async ({ sources: _sources, metadata }) => {
      const sources = _sources.map((h: any) => ({
        ...h,
        clientTime: parseISO(h.clientTime ?? new Date()),
        savingTime: subMinutes(new Date(), 1),
        processed: null,
      }));

      await runParserTest({
        parsers: { search: process },
        codec: SearchMetadata,
        mapSource: (h: any) => ({
          html: h,
          jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
          supporter: undefined,
          findings: {},
        }),
        sourceSchema: appTest.config.get('schema').htmls,
        db,
        getEntryDate: (e) => e.html.savingTime,
        getEntryNatureType: (e) => e.html.nature.type,
        getContributions: getLastHTMLs({ db }),
        saveResults: updateMetadataAndMarkHTML({ db }),
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
            ...expectedMetadata
          } = metadata;

          const {
            htmls: _htmls,
            clientTime: _clientTimeNewM,
            ...expectedUpdatedMetadata
          } = updatedMetadata as any;

          expect({
            ...expectedUpdatedMetadata,
            results: expectedUpdatedMetadata.results.map((r) => ({
              ...r,
              published: r.published
                .replace(/\d{1}\s(year)$/gi, 'a year')
                .replace(/\d{1}\s(month)$/gi, 'a month')
                .replace(/\d{1}\s(day)$/gi, 'a day')
                .replace(/\d{1}\s(hour)$/gi, 'an hour')
                .replace(/\d{1}\s(minute)$/gi, 'a minute'),
            })),
          }).toMatchObject({
            ...expectedMetadata,
          });
        },
      })({ sources, metadata });
    }
  );
});
