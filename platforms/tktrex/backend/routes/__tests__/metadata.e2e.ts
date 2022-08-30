/* eslint-disable import/first */
// mock curly module
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import { MetadataArb } from '@tktrex/shared/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../test/Test';

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
        name: 'Bad Request',
      });
    });

    it('succeeds with valid `researchTag` ', async () => {
      const researchTag = 'test-tag';
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const amount = 10;

      const metadataWithExperimentId = fc.sample(MetadataArb, 100).map((m) => ({
        ...m,
        savingTime: new Date(),
        experimentId,
      }));

      const metadataWithResearchTag = fc.sample(MetadataArb, 100).map((m) => ({
        ...m,
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
        .map((m) => {
          return {
            ...m,
            clientTime: m.clientTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          researchTag,
          amount,
        })
        .expect(200);

      expect(body.length).toBe(amount);
      expect(body).toMatchObject(expectedMetadata);

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

      const metadataWithExperimentId = fc.sample(MetadataArb, 100).map((m) => ({
        ...m,
        savingTime: new Date(),
        experimentId,
      }));

      const metadataWithResearchTag = fc.sample(MetadataArb, 100).map((m) => ({
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
        .map((m) => {
          return {
            ...m,
            clientTime: m.clientTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          experimentId,
          amount,
        })
        .expect(200);

      expect(body.length).toBe(amount);
      expect(body).toMatchObject(expectedMetadata);

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
