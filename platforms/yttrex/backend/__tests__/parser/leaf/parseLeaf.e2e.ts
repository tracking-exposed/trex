import {
  readFixtureJSON,
  readFixtureJSONPaths,
  runParserTest,
} from '@shared/test/utils/parser.utils';
import { Ad } from '@yttrex/shared/models/Ad';
import { leafParsers, LeafSource } from '@yttrex/shared/parser';
import base58 from 'bs58';
import { parseISO, subMinutes } from 'date-fns';
import path from 'path';
import nacl from 'tweetnacl';
import {
  addDom,
  getLastLeaves,
  getMetadata,
  getMetadataSchema,
  getSourceSchema,
  toMetadata,
  updateAdvertisingAndMetadata,
} from '../../../lib/parser/leaf';
import { GetTest, Test } from '../../../tests/Test';

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

    const homeHistory = readFixtureJSONPaths(
      path.resolve(__dirname, '../../fixtures/leaves/home')
    );

    test.each(homeHistory)(
      'Should correctly parse leaf contribution %s',
      async (fixturePath) => {
        const { sources: _sources, metadata } = readFixtureJSON(
          fixturePath,
          publicKey
        );
        const sources = _sources.map((s) => ({
          html: {
            ...s,
            publicKey,
            clientTime: parseISO(s.clientTime ?? new Date().toISOString()),
            savingTime: subMinutes(new Date(), 2),
          },
          supporter: {
            publicKey,
          },
          findings: {},
        }));

        await runParserTest({
          name: 'yt-leaves',
          log: appTest.logger,
          sourceSchema: getSourceSchema(),
          metadataSchema: getMetadataSchema(),
          parsers: leafParsers,
          codecs: { contribution: LeafSource, metadata: Ad },
          db,
          addDom,
          getEntryId: (e) => e.html.id,
          getEntryDate: (e) => e.html.savingTime,
          getEntryNatureType: (e) =>
            e.html.nature?.type ?? (e.html as any).type,
          getContributions: getLastLeaves(db),
          getMetadata: getMetadata(db),
          buildMetadata: toMetadata,
          saveResults: updateAdvertisingAndMetadata(db),
          config: {},
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
