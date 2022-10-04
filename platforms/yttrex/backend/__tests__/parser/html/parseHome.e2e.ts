import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { HomeMetadata } from '@yttrex/shared/models/Metadata';
import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { v4 as uuid } from 'uuid';
import path from 'path';
import nacl from 'tweetnacl';
import { HTMLSource } from '@yttrex/shared/parser';
import {
  addDom,
  getLastHTMLs,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  updateMetadataAndMarkHTML,
} from '../../../lib/parser/html';
import processHome from '@yttrex/shared/parser/parsers/home';
import { toMetadata } from '@yttrex/shared/parser/metadata';
import { GetTest, Test } from '../../../tests/Test';

describe('Parser: home', () => {
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

  jest.useRealTimers();

  jest.setTimeout(20 * 1000);

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

  const failingIds = ['1c144b8476d67668f19cc9e8d4f235890181d26a'];

  const history = readFixtureJSONPaths(
    path.resolve(__dirname, '../../fixtures/htmls/home'),
    { exclude: failingIds }
  );
  // .filter((v, i) => ![5, 9].includes(i));

  test.each(history)(
    'Should correctly parse home contributions %s',
    async (filePath) => {
      const { sources: _sources, metadata } = readFixtureJSON(
        filePath,
        publicKey
      );
      const sources = _sources.map((h: any) => ({
        html: {
          id: uuid(),
          ...h,
          clientTime: parseISO(h.clientTime ?? new Date()),
          savingTime: subMinutes(new Date(), 1),
          processed: null,
        },
        supporter: {},
      }));

      await runParserTest({
        name: 'yt-home',
        log: appTest.logger,
        parsers: { nature: processHome },
        db,
        codecs: {
          contribution: HTMLSource,
          metadata: HomeMetadata.type,
        },
        addDom,
        sourceSchema: getSourceSchema(),
        metadataSchema: getMetadataSchema(),
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
              ({
                thumbnailHref,
                publicationTime,
                recommendedRelativeSeconds,
                ...s
              }) => ({
                ...s,
                // publicationTime: publicationTime?.toISOString() ?? null,
              })
            )
          ).toMatchObject(
            expectedSelected.map(
              ({
                thumbnailHref,
                recommendedRelativeSeconds,
                publicationTime,
                ...s
              }) => ({
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
