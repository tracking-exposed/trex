import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { v4 as uuid } from 'uuid';
import { TKMetadata } from '@tktrex/shared/models';
import { parsers } from '@tktrex/shared/parser/parsers';
import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import path from 'path';
import nacl from 'tweetnacl';
import { GetTest, Test } from '../test/Test';
import {
  addDom,
  buildMetadata,
  getLastHTMLs,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  parserConfig,
  updateMetadataAndMarkHTML,
} from '../lib/parser';
import { HTMLSource } from '@tktrex/shared/parser/source';

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
      path.resolve(__dirname, 'fixtures/native')
    );

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

        await runParserTest({
          name: 'native-parser',
          log: appTest.logger,
          parsers: parsers,
          db,
          codecs: {
            contribution: HTMLSource,
            metadata: TKMetadata.TKMetadata,
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
          buildMetadata: buildMetadata,
          config: parserConfig,
          expectSources: (receivedSources) => {
            receivedSources.forEach((s) => {
              expect((s as any).processed).toBe(true);
            });
          },
          expectMetadata: (receivedMetadata, expectedMetadata) => {
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
              type: typeExp,
              ...expectedM
            } = expectedMetadata as any;

            expect(receivedM).toMatchObject(expectedM);
          },
        })({ sources, metadata });
      }
    );
  });
});
