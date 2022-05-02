import base58 from 'bs58';
import nacl from 'tweetnacl';
import { Ad } from '../../../models/Ad';
import { processLeaf } from '../../../parsers/leaf';
import {
  getLastLeaves,
  updateAdvertisingAndMetadata,
} from '../../../lib/parser/leaf';
import { GetTest, Test } from '../../../tests/Test';
import { readHistoryResults, runParserTest } from '../html/utils';
import { parseISO, subMinutes } from 'date-fns';

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

  afterEach(async () => {
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
  });

  describe('Leaves', () => {
    jest.setTimeout(20 * 1000);

    const history = readHistoryResults('leaves/home', publicKey);

    test.each([history[0]])(
      'Should correctly parse leaf contribution',
      async ({ sources: _sources, metadata }) => {
        const sources = _sources.map((s) => ({
          ...s,
          clientTime: parseISO(s.clientTime ?? new Date().toISOString()),
          savingTime: subMinutes(new Date(), 2),
        }));

        await runParserTest({
          log: appTest.logger,
          sourceSchema: appTest.config.get('schema').leaves,
          metadataSchema: appTest.config.get('schema').ads,
          parsers: { home: processLeaf },
          codec: Ad,
          db,
          mapSource: (h) => h,
          getEntryDate: (e) => e.savingTime,
          getEntryNatureType: (e) => e.nature?.type,
          getContributions: getLastLeaves({ db }),
          saveResults: updateAdvertisingAndMetadata({ db }),
          expectSources: (sources) => {},
          expectMetadata: (oldM, newM) => {
            const {
              _id: expected_Id,
              id: expectedId,
              sections: sectionsExp,
              selected: selectedExp,
              clientTime: clientTimeExp,
              savingTime: savingTimeExp,
              login: loginExp,
              type: typeExp,
              blang: blangExp,
              ...expectedM
            } = oldM as any;

            const {
              _id: _received_Id,
              id: _receivedId,
              sections: sectionsRec,
              selected: selectedRec,
              clientTime: clientTimeRec,
              savingTime: savingTimeRec,
              login: loginRec,
              type: typeRec,
              blang: blangRec,
              ...receivedM
            } = newM as any;

            expect({
              ...receivedM,
            }).toMatchObject(expectedM);

            // expect(sectionsRec?.length).toBe(sectionsExp?.length);
          },
        })({ sources, metadata });
      }
    );
  });
});
