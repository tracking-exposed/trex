/* eslint-disable import/first */
// mock curly module
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import { string2Food } from '@shared/utils/food.utils';
import { NativeMetadataArb } from '@tktrex/shared/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../test/Test';

const toNativeMetadata = ({ _id, publicKey, ...m }: any): any => {
  return {
    ...m,
    id: m.id.substring(0, 10),
    author: m.author ? { ...m.author, name: m.author.name ?? null } : null,
    music: m.music ?? null,
    metrics: m.metrics ?? null,
    description: m.description ?? null,
    researchTag: m.researchTag ?? null,
    supporter: string2Food(m.publicKey),
    clientTime:
      typeof m.clientTime === 'string'
        ? m.clientTime
        : (m.clientTime as any).toISOString(),
    savingTime: (m.savingTime as any).toISOString(),
  };
};
describe('Metadata API', () => {
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe('/v2/metadata', () => {
    it('fails with invalid `amount`', async () => {
      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          amount: 'invalid',
        })
        .expect(400);

      expect(body).toMatchObject({
        name: 'APIError',
        message: 'Request validation failed.'
      });
    });

    it('succeeds with valid `researchTag` ', async () => {
      const researchTag = 'test-tag';
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const amount = 10;

      const metadataWithExperimentId = fc
        .sample(NativeMetadataArb, 100)
        .map(({ ...m }) => ({
          ...m,
          savingTime: new Date(),
          researchTag: undefined,
          experimentId,
        }));

      const metadataWithResearchTag = fc
        .sample(NativeMetadataArb, 100)
        .map(({ ...m }) => ({
          ...m,
          experimentId: null,
          savingTime: new Date(),
          researchTag,
        }));

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        [...metadataWithResearchTag, ...metadataWithExperimentId]
      );

      const expectedMetadata = metadataWithResearchTag
        .sort((a, b) => b.savingTime.getTime() - a.savingTime.getTime())
        .slice(0, amount)
        .map(toNativeMetadata);

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          researchTag,
          amount,
        })
        .expect(200);

      expect(body).toMatchObject({
        data: expectedMetadata,
        totals: {
          native: metadataWithResearchTag.length,
        },
      });

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          id: {
            $in: [...metadataWithExperimentId, ...metadataWithResearchTag].map(
              (m) => m.id
            ),
          },
        }
      );
    });

    it('succeeds with valid `experimentId` ', async () => {
      const researchTag = 'test-tag';
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const amount = 10;

      const metadataWithExperimentId = fc
        .sample(NativeMetadataArb, 100)
        .map(({ ...m }) => ({
          ...m,
          savingTime: new Date(),
          experimentId,
        }));

      const metadataWithResearchTag = fc
        .sample(NativeMetadataArb, 100)
        .map(({ ...m }) => ({
          ...m,
          savingTime: new Date(),
          researchTag,
        }));

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        [...metadataWithResearchTag, ...metadataWithExperimentId]
      );

      const expectedMetadata = metadataWithExperimentId
        .sort((a, b) => b.savingTime.getTime() - a.savingTime.getTime())
        .slice(0, amount)
        .map(toNativeMetadata);

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          experimentId,
          amount,
        })
        .expect(200);

      expect(body.data.length).toBe(amount);

      expect(body).toMatchObject({
        data: expectedMetadata,
        totals: { native: metadataWithExperimentId.length },
      });

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          id: {
            $in: [...metadataWithExperimentId, ...metadataWithResearchTag].map(
              (m) => m.id
            ),
          },
        }
      );
    });
  });
});
