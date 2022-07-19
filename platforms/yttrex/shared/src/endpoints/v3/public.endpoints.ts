import {
  CreateExperimentResponse, GetPublicDirectivesOutput
} from '@shared/models/Experiment';
import { HandshakeBody } from '@shared/models/HandshakeBody';
import {
  GetRecommendationsParams,
  GetRecommendationsQuery,
  RecommendationList
} from '@shared/models/Recommendation';
import { Step } from '@shared/models/Step';
import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

const Handshake = Endpoint({
  Method: 'POST',
  getPath: () => `/v3/handshake`,
  Input: {
    Body: HandshakeBody,
  },
  Output: t.any,
});

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

const PostDirective = Endpoint({
  Method: 'POST',
  getPath: () => `/v3/directives`,
  Input: {
    Headers: t.type({
      'Content-Type': t.string,
    }),
    Body: t.array(Step),
  },
  Output: CreateExperimentResponse,
});

const GetDirective = Endpoint({
  Method: 'GET',
  getPath: ({ experimentId }) => `/v3/directives/${experimentId}`,
  Input: {
    Params: t.type({
      experimentId: t.string,
    }),
  },
  Output: t.array(Step),
});

const GetPublicDirectives = Endpoint({
  Method: 'GET',
  getPath: () => `/v3/directives/public`,
  Output: GetPublicDirectivesOutput,
});

export const endpoints = {
  Handshake,
  GetRecommendations,
  VideoRecommendations,
  GetDirective,
  PostDirective,
  GetPublicDirectives,
};
