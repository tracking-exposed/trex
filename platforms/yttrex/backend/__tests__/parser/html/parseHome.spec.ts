import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { JSDOM } from 'jsdom';
import nacl from 'tweetnacl';
import {
  getLastHTMLs,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import { HomeMetadata } from '../../../models/Metadata';
import process from '../../../parsers/home';
import { GetTest, Test } from '../../../tests/Test';
import { readHistoryResults, runParserTest } from './utils';

describe('Parserv', () => {
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

  describe('Home', () => {
    jest.setTimeout(20 * 1000);

    const history = readHistoryResults('home', publicKey);

    test.each(history)(
      'Should correctly parse home contributions',
      async ({ sources: _sources, metadata }) => {
        const sources = _sources.map((h: any) => ({
          ...h,
          clientTime: parseISO(h.clientTime ?? new Date()),
          savingTime: subMinutes(new Date(), 1),
          processed: null,
        }));

        await runParserTest({
          log: appTest.logger,
          sourceSchema: appTest.config.get('schema').htmls,
          parsers: { home: process },
          mapSource: (h: any) => ({
            html: h,
            jsdom: new JSDOM(h.html.replace(/\n +/g, '')).window.document,
            supporter: undefined,
            findings: {},
          }),
          db,
          getEntryDate: (e) => e.html.savingTime,
          getEntryNatureType: (e) => e.html.nature.type,
          getContributions: getLastHTMLs({ db }),
          saveResults: updateMetadataAndMarkHTML({ db }),
          codec: HomeMetadata,
          expectSources: (sources) => {
            sources.forEach((r: any) => {
              expect(r.processed).toBe(true);
            });
          },
          expectMetadata: (newM, oldM) => {
            const {
              _id: expected_Id,
              id: expectedId,
              clientTime: _expectedClientTime,
              savingTime: _expectedSavingTime,
              selected: expectedSelected,
              sections: expectedSections,
              ...expectedM
            } = oldM as any;
            const {
              _id: _received_Id,
              id: _receivedId,
              clientTime: _receivedClientTime,
              savingTime: _receivedSavingTime,
              selected: receivedSelected,
              sections: receivedSections,
              ...receivedM
            } = newM as any;

            expect(receivedSections.length).toBeGreaterThanOrEqual(
              expectedSections.length
            );
            expect(receivedSelected.length).toBeGreaterThanOrEqual(
              expectedSelected.length
            );
            expect(
              receivedSelected.map(
                ({ thumbnailHref, publicationTime, ...s }) => ({
                  ...s,
                })
              )
            ).toMatchObject(
              expectedSelected.map(
                ({ thumbnailHref, publicationTime, ...s }) => ({
                  ...s,
                })
              )
            );
            expect(receivedM).toMatchObject(expectedM);
          },
        })({ sources, metadata });
      }
    );
  });
});
