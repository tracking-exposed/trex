import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest
} from '@shared/test/utils/parser.utils';
import axiosMock from '@shared/test/__mocks__/axios.mock';
import { string2Food } from '@shared/utils/food.utils';
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
  updateMetadataAndMarkHTML
} from '../lib/parser';
import { GetTest, Test } from '../test/Test';

describe('Parser: "native"', () => {
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

  describe('Native', () => {
    jest.setTimeout(20 * 1000);

    const history = readFixtureJSONPaths(
      path.resolve(__dirname, 'fixtures/htmls/native')
    );

    axiosMock.get.mockImplementation((url, config) => {
      return Promise.resolve({ status: 500, data: '' });
    });

    test.each(history)(
      'Should correctly parse "native" contribution from path %s',
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

        axiosMock.get.mockImplementation((url, config) => {
          return Promise.resolve({ status: 500, data: '' });
        });

        await runParserTest<TKParserConfig, TKParsers>({
          name: 'native-parser',
          log: appTest.logger,
          parsers: parsers,
          db,
          codecs: {
            contribution: HTMLSource,
            metadata: TKMetadata.NativeMetadata,
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
          buildMetadata: (e, m) => ({
            ...toMetadata(e, m),
            supporter: string2Food(e.source.html.publicKey),
          }),
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
          expectMetadata: (receivedMetadata, expectedMetadata) => {
            expect(axiosMock.get).toHaveBeenCalledTimes(1);

            const {
              _id: received_Id,
              id: receivedId,
              savingTime: savingTimeR,
              ...receivedM
            } = receivedMetadata as any;

            const {
              _id: _received_Id,
              id: _receivedId,
              clientTime: clientTimeExp,
              savingTime: savingTimeExp,
              ...expectedM
            } = expectedMetadata as any;

            expect(receivedM.thumbnail).toMatchObject({
              reason: 500,
              filename: expect.any(String),
              downloaded: false,
            });
            expect(receivedM).toMatchObject(expectedM);
          },
        })({ sources, metadata });
      }
    );
  });
});
