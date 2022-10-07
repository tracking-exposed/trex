import axiosMock from '@shared/test/__mocks__/axios.mock';
import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { TKMetadata } from '@tktrex/shared/models';
import { TKParserConfig } from '@tktrex/shared/parser/config';
import { toMetadata } from '@tktrex/shared/parser/metadata';
import { parsers, TKParsers } from '@tktrex/shared/parser/parsers';
import { HTMLSource } from '@tktrex/shared/parser/source';
import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import path from 'path';
import nacl from 'tweetnacl';
import { v4 as uuid } from 'uuid';
import {
  addDom,
  getLastHTMLs,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  updateMetadataAndMarkHTML,
} from '../lib/parser';
import { GetTest, Test } from '../test/Test';

describe('Parser: "search"', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  let db: any;
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
  });

  describe('Nature Search', () => {
    jest.setTimeout(20 * 1000);

    const history = readFixtureJSONPaths(
      path.resolve(__dirname, 'fixtures/htmls/search')
    );

    axiosMock.get.mockImplementation((url, config) => {
      return Promise.resolve({ status: 500, data: '' });
    });

    test.each(history)(
      'Should correctly parse "search" contribution from path %s',
      async (fixturePath) => {
        const { sources: _sources, metadata } = readFixtureJSON(
          fixturePath,
          publicKey
        );
        const sources = _sources.map((s: any) => ({
          html: {
            ...s,
            id: uuid(),
            clientTime: parseISO(s.clientTime ?? new Date().toISOString()),
            savingTime: subMinutes(new Date(), 2),
          },
          supporter: { version: process.env.VERSION },
        }));

        await runParserTest<TKParserConfig, TKParsers>({
          name: 'native-parser',
          log: appTest.logger,
          parsers: parsers,
          db,
          codecs: {
            contribution: HTMLSource,
            metadata: TKMetadata.SearchMetadata,
          },
          addDom,
          sourceSchema: getSourceSchema(),
          metadataSchema: getMetadataSchema(),
          getEntryId: (e) => e.html.id,
          getEntryDate: (e) => e.html.savingTime,
          getEntryNatureType: (e) => e.html.type,
          getContributions: getLastHTMLs(db),
          getMetadata: getMetadata(db),
          saveResults: updateMetadataAndMarkHTML(db),
          buildMetadata: toMetadata,
          config: {
            downloads: path.resolve(
              process.cwd(),
              appTest.config.get('downloads')
            ),
          },
          expectSources: (receivedSources) => {
            receivedSources.forEach((s) => {
              expect((s as any).processed).toBe(true);
            });
          },
          expectMetadata: (
            receivedMetadata: TKMetadata.SearchMetadata,
            expectedMetadata: TKMetadata.SearchMetadata
          ) => {
            const {
              _id: received_Id,
              id: receivedId,
              clientTime: clientTimeR,
              savingTime: savingTimeR,
              results: resultsR,
              ...receivedM
            } = receivedMetadata as any;

            const {
              _id: __idExp,
              id: _idExp,
              clientTime: clientTimeExp,
              savingTime: savingTimeExp,
              results: resultsExp,
              ...expectedM
            } = expectedMetadata as any;

            expect(receivedM).toMatchObject(expectedM);
            expect(
              resultsR.map((r: any) => ({
                ...r,
                publishingDate: r.publishingDate
                  ? parseISO(r.publishingDate)
                  : undefined,
              }))
            ).toMatchObject(
              resultsExp.map((r: any) => ({
                ...r,
                publishingDate: r.publishingDate ? expect.any(Date) : undefined,
              }))
            );
          },
        })({ sources, metadata });
      }
    );
  });
});
