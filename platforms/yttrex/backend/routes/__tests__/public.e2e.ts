/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import { HomeMetadataArb } from '@yttrex/shared/arbitraries/Metadata.arb';
import { HomeMetadata } from '@yttrex/shared/models/metadata/HomeMetadata';
import { v4 as uuid } from 'uuid';
import { GetTest, Test } from '../../tests/Test';

describe('The Public API', () => {
  const channelId = uuid();
  let test: Test;
  let homes: HomeMetadata[];
  const publicKey = 'public-key';

  beforeAll(async () => {
    test = await GetTest();
    homes = fc.sample(HomeMetadataArb, 10).map((h) => ({
      ...h,
      publicKey,
      savingTime: new Date(),
      selected: h.selected as any[],
    }));

    await test.mongo3.insertMany(
      test.mongo,
      test.config.get('schema').metadata,
      homes
    );
  });

  afterAll(async () => {
    await test.mongo3.deleteMany(
      test.mongo,
      test.config.get('schema').metadata,
      {
        publicKey: { $eq: publicKey },
      }
    );
    await test.mongo.close();
  });

  describe('v1', () => {
    describe('GET /v1/home', () => {
      it('returns home list', async () => {
        const { body } = await test.app.get(`/api/v1/home`).expect(200);

        expect(body).toBeInstanceOf(Array);
      });
    });
  });
});
