/* eslint-disable import/first */
// mock curly module
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import { string2Food } from '@shared/utils/food.utils';
import {
  ForYouVideoMetaDataArb,
  NativeMetadataArb,
} from '@tktrex/shared/arbitraries/Metadata.arb';
import { NativeType } from '@tktrex/shared/models/Nature';
import { GetTest, Test } from '../../test/Test';

const toNativeMetadata = ({
  _id,
  publicKey,
  author,
  description,
  researchTag,
  experimentId,
  ...m
}: any): any => {
  return {
    ...m,
    id: m.id.substring(0, 10),
    blang: m.blang ?? null,
    ...(author ? { author: { ...author, name: author.name ?? null } } : {}),
    music: m.music ?? null,
    metrics: m.metrics ?? null,
    ...(description ? { description } : {}),
    ...(researchTag ? { researchTag } : {}),
    ...(experimentId ? { experimentId } : {}),
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
        message: 'Request validation failed.',
      });
    });

    it('succeeds with valid `researchTag` ', async () => {
      const researchTag = fc.sample(fc.string({ minLength: 10 }), 1)[0];
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

      const metadata = [
        ...metadataWithResearchTag,
        ...metadataWithExperimentId,
      ];
      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
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

      const metadata = [
        ...metadataWithResearchTag,
        ...metadataWithExperimentId,
      ];

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
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
            $in: metadata.map((m) => m.id),
          },
        }
      );
    });

    it('succeeds with "native" metadata filtered by description', async () => {
      const description = 'funny description';
      const totalNative = 100;
      const amount = 10;

      const nativeMetadata = fc
        .sample(NativeMetadataArb, totalNative)
        .map(({ ...m }, i) => ({
          ...m,
          description: i % 2 == 0 ? description : m.description,
          savingTime: new Date(),
        }));

      const forYouMetadata = fc
        .sample(ForYouVideoMetaDataArb, 100)
        .map(({ ...m }) => ({
          ...m,
          savingTime: new Date(),
        }));

      const metadata = [...forYouMetadata, ...nativeMetadata];
      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
      );

      const expectedMetadata = nativeMetadata
        .filter((a, i) => i % 2 === 0)
        .sort((a, b) => b.savingTime.getTime() - a.savingTime.getTime())
        .slice(0, amount)
        .map(toNativeMetadata);

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          filter: {
            nature: NativeType.value,
            description,
          },
          amount,
        })
        .expect(200);

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          id: {
            $in: metadata.map((m) => m.id),
          },
        }
      );

      expect(body.data.length).toBe(amount);

      expect(body).toMatchObject({
        data: expectedMetadata,
        totals: { native: totalNative / 2 },
      });
    });
  });
});
