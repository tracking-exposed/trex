/* eslint-disable import/first */
// mock curly module
jest.mock('../../lib/curly');
jest.mock('fetch-opengraph');

// import test utils
import { ContentCreator } from '@shared/models/ContentCreator';
import { Recommendation } from '@shared/models/Recommendation';
import { Video } from '@shared/models/Video';
import { fc } from '@shared/test';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  ParsedInfoArb,
  VideoMetadataArb,
} from '../../tests/arbitraries/Metadata.arb';
import { GetTest, Test } from '../../tests/Test';

describe('The Public API', () => {
  const channelId = uuid();
  let test: Test;

  beforeAll(async () => {
    test = await GetTest();
  });

  afterAll(async () => {
    await test.mongo.close();
  });

  describe('Get Content Creator Related Channels', () => {
    it('fails when amount is negative', async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/${channelId}/related`)
        .query({
          amount: -10,
        })
        .expect(500);

      expect(body.message).toEqual('the limit must be positive');
    });

    it('returns empty results when channelId is missing', async () => {
      const { body } = await test.app
        .get(`/api/v3/creator/${channelId}/related`)
        .expect(200);

      expect(body).toMatchObject({
        content: [],
        authorName: null,
        totalRecommendations: 0,
        pagination: {
          amount: 10,
          skip: 0,
        },
        score: 0,
      });
    });

    it('returns results related to the channelId by amount and skip', async () => {
      const firstPercentage = 10;
      const firstRelatedSource = fc.sample(fc.string({ minLength: 5 }));
      const metadata = fc.sample(VideoMetadataArb, 100).map((m) => ({
        ...m,
        related: fc.sample(ParsedInfoArb, 100).map((p, i) => ({
          ...p,
          recommendedSource:
            i < firstPercentage ? firstRelatedSource : `index-${i}`,
        })),
        authorSource: `/channel/${channelId}`,
      }));

      const totalRelatedChannels = _.keys(
        _.countBy(_.flatten(_.map(metadata, 'related')), 'recommendedSource')
      ).length;

      await test.mongo3.insertMany(
        test.mongo,
        test.config.get('schema').metadata,
        metadata
      );

      const firstResponse = await test.app
        .get(`/api/v3/creator/${channelId}/related`)
        .query({
          amount: 20,
          skip: 0,
        })
        .expect(200);

      expect(firstResponse.body.content.length).toBe(20);
      expect(firstResponse.body.content[0]).toMatchObject({
        recommendedSource: firstRelatedSource,
        percentage: firstPercentage,
      });

      expect(firstResponse.body.totalRecommendations).toBe(
        totalRelatedChannels
      );

      const secondResponse = await test.app
        .get(`/api/v3/creator/${channelId}/related`)
        .query({
          amount: 20,
          skip: 20,
        })
        .expect(200);

      expect(secondResponse.body.content.length).toBe(20);
      expect(secondResponse.body.totalRecommendations).toBe(
        totalRelatedChannels
      );

      const thirdResponse = await test.app
        .get(`/api/v3/creator/${channelId}/related`)
        .query({
          amount: 20,
          skip: 100,
        })
        .expect(200);

      expect(thirdResponse.body.content.length).toBe(0);
      expect(thirdResponse.body.totalRecommendations).toBe(
        totalRelatedChannels
      );

      await test.mongo3.deleteMany(
        test.mongo,
        test.config.get('schema').metadata,
        {
          authorSource: `/channel/${channelId}`,
        }
      );
    });
  });
});
