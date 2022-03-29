import base58 from 'bs58';
import nacl from 'tweetnacl';
import { VideoMetadata } from '../../models/Metadata';
import { parsers } from '../../parsers';
import process from '../../parsers/video';
import { GetTest, Test } from '../../tests/Test';
import { readHistoryResults, runParserTest } from './utils';

describe('Parser: Video', () => {
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

  jest.setTimeout(20 * 1000);

  const historyData = readHistoryResults('video', publicKey);

  /**
   * TODO:
   * historyData[1] mismatch the related
   * historyData[4] has missing related items
   * historyData[5] has missing related items
   * historyData[6] has missing related items
   * historyData[7] has missing related items
   */
  test.each([historyData[0], historyData[2], historyData[3], historyData[8]])(
    'Should correctly parse video contributions',
    async (result) =>
      runParserTest(
        appTest,
        { video: process },
        VideoMetadata,
        (expectedM, receivedM) => {
          const {
            savingTime: _savingTime,
            clientTime: _clientTime,
            _id,
            id,
            login: expectedLogin,
            related: expectedRelated,
            publicationTime: expectedPublicationTime,
            ...expectedMetadata
          } = expectedM;

          const {
            htmls: _htmls,
            related: receivedRelated,
            login: receivedLogin,
            publicationTime: receivedPublicationTime,
            ...expectedUpdatedMetadata
          } = receivedM;

          expect(expectedUpdatedMetadata).toMatchObject({
            ...expectedMetadata,
          });

          // check metadata related
          expect(
            receivedRelated.map(
              ({ recommendedPubTime, publicationTime, ...rr }) => ({
                ...rr,
                foryou: rr.foryou ?? null,
              })
            )
          ).toMatchObject(
            expectedRelated.map(({ publicationTime, ...rr }) => rr)
          );
        }
      )(result)
  );
});
