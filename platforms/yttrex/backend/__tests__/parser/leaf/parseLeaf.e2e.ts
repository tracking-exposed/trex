import base58 from 'bs58';
import nacl from 'tweetnacl';
import { Ad } from '@yttrex/shared/models/Ad';
import { sanitizeHTML } from '@shared/utils/html.utils';
import { leafParsers } from '../../../parsers';
import {
  getLastLeaves,
  LeafSource,
  toMetadata,
  updateAdvertisingAndMetadata,
} from '../../../lib/parser/leaf';
import { GetTest, Test } from '../../../tests/Test';
import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { parseISO, subMinutes } from 'date-fns';
import path from 'path';
import { JSDOM } from 'jsdom';

describe('Leaves parser', () => {
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

  describe('Leaves', () => {
    jest.setTimeout(20 * 1000);

    const history = readFixtureJSONPaths(
      path.resolve(__dirname, '../../fixtures/leaves/home'),
      publicKey
    );

    test.each(history)(
      'Should correctly parse leaf contribution',
      async (fixturePath) => {
        const { sources: _sources, metadata } = readFixtureJSON(fixturePath);
        const sources = _sources.map((s) => ({
          html: {
            ...s,
            publicKey,
            clientTime: parseISO(s.clientTime ?? new Date().toISOString()),
            savingTime: subMinutes(new Date(), 2),
          },
          jsdom: new JSDOM(sanitizeHTML(s.html)).window.document,
          supporter: {
            publicKey,
          },
          findings: {},
        }));

        await runParserTest({
          log: appTest.logger,
          sourceSchema: appTest.config.get('schema').leaves,
          metadataSchema: appTest.config.get('schema').ads,
          parsers: leafParsers,
          codecs: { contribution: LeafSource, metadata: Ad },
          db,
          getEntryId: (e) => e.html.id,
          buildMetadata: toMetadata,
          getEntryDate: (e) => e.html.savingTime,
          getEntryNatureType: (e) =>
            e.html.nature?.type ?? (e.html as any).type,
          getContributions: getLastLeaves(db),
          saveResults: updateAdvertisingAndMetadata(db),
          expectSources: (sources) => {
            sources
              // source with channel1 will be ignored
              .filter((s) => s.html.selectorName !== 'channel1')
              .forEach((s) => {
                expect((s as any).processed).toBe(true);
              });
          },
          expectMetadata: (receivedMetadata, expectedMetadata) => {
            const {
              _id: received_Id,
              id: receivedId,
              publicKey: receivedPublicKey,
              // sections: sectionsR,
              // clientTime: clientTimeR,
              savingTime: savingTimeR,
              // type: typeR,
              // login: loginR,
              // blang: blangR,
              ...receivedM
            } = receivedMetadata;

            const {
              _id: _received_Id,
              id: _receivedId,
              blang: blangE,
              login: loginE,
              sections: sectionsExp,
              selected: selectedExp,
              clientTime: clientTimeExp,
              savingTime: savingTimeExp,
              type: typeExp,
              publicKey: expectedPublicKey,
              // login: loginExp,
              // blang: blangExp,
              ...expectedM
            } = expectedMetadata as any;

            expect({
              ...receivedM,
            }).toMatchObject(expectedM);
          },
        })({ sources, metadata });

        await appTest.mongo3.deleteMany(
          appTest.mongo,
          appTest.config.get('schema').leaves,
          {
            publicKey: {
              $eq: publicKey,
            },
          }
        );

        await appTest.mongo3.deleteMany(
          appTest.mongo,
          appTest.config.get('schema').ads,
          {
            publicKey: {
              $eq: publicKey,
            },
          }
        );
      }
    );
  });
});
