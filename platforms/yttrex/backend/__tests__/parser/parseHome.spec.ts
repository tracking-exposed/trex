import base58 from 'bs58';
import nacl from 'tweetnacl';
import { HomeMetadata } from '../../models/Metadata';
import process from '../../parsers/home';
import { GetTest, Test } from '../../tests/Test';
import { readHistoryResults, runParserTest } from './utils';

describe('Parserv', () => {
  let appTest: Test;
  const newKeypair = nacl.sign.keyPair();
  const publicKey = base58.encode(newKeypair.publicKey);

  beforeAll(async () => {
    appTest = await GetTest();
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

    test.each(readHistoryResults('home', publicKey))(
      'Should correctly parse video contributions',
      async (result) =>
        runParserTest(
          appTest,
          { home: process },
          HomeMetadata,
          (oldM, newM) => {
            const {
              _id: expected_Id,
              id: expectedId,
              clientTime: _expectedClientTime,
              savingTime: _expectedSavingTime,
              selected: _expectedSelected,
              sections: _expectedSections,
              ...expectedM
            } = oldM as any;
            const {
              _id: _received_Id,
              id: _receivedId,
              clientTime: _receivedClientTime,
              savingTime: _receivedSavingTime,
              selected: _receivedSelected,
              sections: _receivedSections,
              ...receivedM
            } = newM as any;

            expect({
              ...receivedM,
              blang: receivedM.blang ?? null,
            }).toMatchObject(expectedM);
          }
        )(result)
    );
  });
});
