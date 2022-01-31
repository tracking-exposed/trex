import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types/lib/nonEmptyArray';
import { Endpoint } from 'ts-endpoint';
import {
  CreateDirectiveBody,
  Directive,
  DirectiveType,
  PostDirectiveResponse,
} from '../../models/Directive';
import { GuardoniExperiment } from '../../models/Experiment';
import { HandshakeBody } from '../../models/HandshakeBody';
import {
  GetRecommendationsParams,
  GetRecommendationsQuery,
  Recommendation,
} from '../../models/Recommendation';

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
  getPath: ({ videoId }) =>
    `/v3/videos/${videoId}/recommendations`,
  Input: {
    Params: t.type({
      videoId: t.string,
    }),
    Query: t.type({
      channelId: t.union([t.string, t.undefined]),
    })
  },
  Output: t.array(Recommendation),
});

const GetRecommendations = Endpoint({
  Method: 'GET',
  getPath: ({ ids }) => `/v3/recommendations/${ids}`,
  Input: {
    Query: GetRecommendationsQuery,
    Params: GetRecommendationsParams,
  },
  Output: t.array(Recommendation),
});

const PostDirective = Endpoint({
  Method: 'POST',
  getPath: ({ directiveType }) => `/v3/directives/${directiveType}`,
  Input: {
    Headers: t.type({
      'Content-Type': t.string,
    }),
    Params: t.type({
      directiveType: DirectiveType,
    }),
    Body: CreateDirectiveBody,
  },
  Output: PostDirectiveResponse,
});

const GetDirective = Endpoint({
  Method: 'GET',
  getPath: ({ experimentId }) => `/v3/directives/${experimentId}`,
  Input: {
    Params: t.type({
      experimentId: t.string,
    }),
  },
  Output: nonEmptyArray(Directive),
});

const GetPublicDirectives = Endpoint({
  Method: 'GET',
  getPath: () => `/v3/directives/public`,
  Output: t.array(GuardoniExperiment),
});

const ConcludeExperiment = Endpoint({
  Method: 'DELETE',
  getPath: ({ testTime }) => `/v3/experiment/${testTime}`,
  Input: {
    Params: t.type({ testTime: t.string }),
  },
  Output: t.type({
    acknowledged: t.boolean,
  }),
});

export const endpoints = {
  Handshake,
  GetRecommendations,
  VideoRecommendations,
  GetDirective,
  PostDirective,
  ConcludeExperiment,
  GetPublicDirectives,
};
