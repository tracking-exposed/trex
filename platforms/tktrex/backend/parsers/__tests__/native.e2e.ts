import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { TKMetadata } from '@tktrex/shared/models';
import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import { JSDOM } from 'jsdom';
import path from 'path';
import nacl from 'tweetnacl';
import {
  addDom,
  buildMetadata,
  getLastHTMLs,
  getMetadata,
  HTMLSource,
  updateMetadataAndMarkHTML,
} from '../../lib/parser';
import { parsers } from '../../parsers';
import { GetTest, Test } from '../../test/Test';

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
      'Should correctly parse "native" contribution',
      async (fixturePath) => {
        const { sources: _sources, metadata } = readFixtureJSON(
          fixturePath,
          publicKey
        );
        const sources = _sources.map((s: any) => ({
          html: {
            ...s,
            clientTime: parseISO(s.clientTime ?? new Date().toISOString()),
            savingTime: subMinutes(new Date(), 2),
          },
          jsdom: new JSDOM(sanitizeHTML(s.html)).window.document,
          supporter: { version: process.env.VERSION },
        }));

        await runParserTest({
          name: 'tk-native',
          log: appTest.logger,
          sourceSchema: appTest.config.get('schema').htmls,
          metadataSchema: appTest.config.get('schema').metadata,
          parsers: parsers,
          db,
          codecs: {
            contribution: HTMLSource,
            metadata: TKMetadata.TKMetadata,
          },
          addDom,
          getMetadata: getMetadata(db),
          getEntryId: (e) => e.html.id,
          buildMetadata: buildMetadata,
          getEntryDate: (e) => e.html.savingTime,
          getEntryNatureType: (e) => e.html.type,
          getContributions: getLastHTMLs(db),
          saveResults: updateMetadataAndMarkHTML(db),
          config: {},
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
