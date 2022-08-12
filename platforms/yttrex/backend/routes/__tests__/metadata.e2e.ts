/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import moment from 'moment';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  ParsedInfoArb,
  VideoMetadataArb,
} from '../../tests/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../tests/Test';

describe('Metadata API', () => {
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe('GET /v2/metadata', () => {
    const researchTag = 'test-tag';

    it('fails when amount is not valid ', async () => {
      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          amount: 'not-valid',
        })
        .expect(400);

      expect(body).toMatchObject({
        name: 'Bad Request',
      });
    });

    it('succeeds with metadata when filtering by "researchTag"', async () => {
      const amount = 10;

      const metadata = fc.sample(VideoMetadataArb, 100).map((m) => ({
        ...m,
        savingTime: new Date(),
        researchTag,
      }));

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
      );

      const expectedMetadata = metadata
        .filter(
          (a) =>
            a.savingTime.getTime() >
            new Date(moment().startOf('day').toISOString()).getTime()
        )
        .sort((a, b) => b.savingTime.getTime() - a.savingTime.getTime())
        .slice(0, amount)
        .map((m) => {
          return {
            ...m,
            clientTime: m.clientTime.toISOString(),
            publicationTime: m.publicationTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
            related: m.related.map((r) => {
              return {
                ...r,
                elems: r.elems ?? null,
                thumbnailHref: r.thumbnailHref ?? null,
                publicationTime: r.publicationTime.toISOString(),
                recommendedPubTime: r.recommendedPubTime
                  ? r.recommendedPubTime.toISOString()
                  : null,
              };
            }),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          researchTag,
          amount,
        })
        .expect(200);

      expect(body.length).toBe(expectedMetadata.length);
      expect(body).toMatchObject(expectedMetadata);

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          id: {
            $in: expectedMetadata.map((m) => m.id),
          },
        }
      );
    });

    it('succeeds with metadata', async () => {
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const amount = 10;

      const metadata = fc.sample(VideoMetadataArb, 100).map((m) => ({
        ...m,
        savingTime: new Date(),
        experimentId,
      }));

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
      );

      const expectedMetadata = metadata
        .filter(
          (a) =>
            a.savingTime.getTime() >
            new Date(moment().startOf('day').toISOString()).getTime()
        )
        .sort((a, b) => b.savingTime.getTime() - a.savingTime.getTime())
        .slice(0, amount)
        .map((m) => {
          return {
            ...m,
            clientTime: m.clientTime.toISOString(),
            publicationTime: m.publicationTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
            related: m.related.map((r) => {
              return {
                ...r,
                elems: r.elems ?? null,
                thumbnailHref: r.thumbnailHref ?? null,
                publicationTime: r.publicationTime.toISOString(),
                recommendedPubTime: r.recommendedPubTime
                  ? r.recommendedPubTime.toISOString()
                  : null,
              };
            }),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          experimentId,
          amount,
        })
        .expect(200);

      expect(body.length).toBe(expectedMetadata.length);
      expect(body).toMatchObject(expectedMetadata);

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          id: {
            $in: expectedMetadata.map((m) => m.id),
          },
        }
      );
    });
  });
});
