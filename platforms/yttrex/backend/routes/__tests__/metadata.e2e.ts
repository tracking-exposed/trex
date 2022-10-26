/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

// import test utils
import { fc } from '@shared/test';
import moment from 'moment';
import _ from 'lodash';
import { VideoMetadataArb } from '../../tests/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../tests/Test';
import * as utils from '../../lib/utils';

const toRelated = (r: any): any => {
  return {
    ...r,
    parameter: r.parameter ?? null,
    elems: r.elems ?? null,
    thumbnailHref: r.thumbnailHref ?? null,
    views: r.views ?? null,
    title: r.title ?? null,
    recommendedViews: r.recommendedViews ?? null,
    recommendedThumbnail: r.recommendedThumbnail ?? null,
    recommendedTitle: r.recommendedTitle ?? null,
    recommendedLength: r.recommendedLength ?? null,
    recommendedSource: r.recommendedSource ?? null,
    recommendedDisplayL: r.recommendedDisplayL ?? null,
    publicationTime: r.publicationTime.toISOString(),
    recommendedPubTime: r.recommendedPubTime
      ? r.recommendedPubTime.toISOString()
      : null,
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
      const total = 100;
      const amount = 10;

      const metadata = fc.sample(VideoMetadataArb, total).map((m) => ({
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
        .map(({ publicKey, _id, ...m }: any) => {
          return {
            ...m,
            id: m.id.substring(0, 20),
            supporter: utils.string2Food(publicKey),
            clientTime: m.clientTime.toISOString(),
            publicationTime: m.publicationTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
            related: m.related.map(toRelated),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          researchTag,
          amount,
        })
        .expect(200);

      expect(body.data.length).toBe(expectedMetadata.length);
      expect(body.data).toMatchObject(expectedMetadata);

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
      const total = 100;
      const experimentId = fc.sample(fc.uuid(), 1)[0];
      const amount = 10;

      const metadata = fc.sample(VideoMetadataArb, total).map((m) => ({
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
        .map(({ publicKey, _id, ...m }: any) => {
          return {
            ...m,
            id: m.id.substring(0, 20),
            supporter: utils.string2Food(publicKey),
            clientTime: m.clientTime.toISOString(),
            publicationTime: m.publicationTime.toISOString(),
            savingTime: m.savingTime.toISOString(),
            related: m.related.map(toRelated),
          };
        });

      const { body } = await test.app
        .get(`/api/v2/metadata`)
        .query({
          experimentId,
          amount,
        })
        .expect(200);

      expect(body.data).toMatchObject(expectedMetadata);
      expect(body.totals).toMatchObject({
        video: total,
      });

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
