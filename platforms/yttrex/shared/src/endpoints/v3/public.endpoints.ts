import {
  GetRecommendationsParams,
  GetRecommendationsQuery,
  RecommendationList
} from '@shared/models/Recommendation';
import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

const VideoRecommendations = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v3/videos/${videoId}/recommendations`,
  Input: {
    Params: t.type({
      videoId: t.string,
    }),
    Query: t.type({
      channelId: t.union([t.string, t.undefined]),
    }),
  },
  Output: RecommendationList,
});

const GetRecommendations = Endpoint({
  Method: 'GET',
  getPath: ({ ids }) => `/v3/recommendations/${ids}`,
  Input: {
    Query: GetRecommendationsQuery,
    Params: GetRecommendationsParams,
  },
  Output: RecommendationList,
});

export const endpoints = {
  GetRecommendations,
  VideoRecommendations,
};
