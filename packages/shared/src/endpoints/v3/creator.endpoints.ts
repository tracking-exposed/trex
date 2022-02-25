import * as t from 'io-ts';
import { SearchQuery } from '../../models/http/SearchQuery';
import { Endpoint } from 'ts-endpoint';
import { AuthorizationHeader, AuthResponse } from '../../models/Auth';
import { GetRelatedChannelsOutput } from '../../models/ChannelRelated';
import {
  ContentCreator,
  ContentCreatorVideosOutput,
  RegisterContentCreatorBody,
} from '../../models/ContentCreator';
import { CreatorStats } from '../../models/CreatorStats';
import * as Recommendation from '../../models/Recommendation';
import * as Video from '../../models/Video';

const GetCreator = Endpoint({
  Method: 'GET',
  getPath: () => `/v3/creator/me`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: ContentCreator,
});

const RegisterCreator = Endpoint({
  Method: 'POST',
  getPath: ({ channelId }) => `/v3/creator/${channelId}/register`,
  Input: {
    Params: t.type({ channelId: t.string }),
    Body: RegisterContentCreatorBody,
  },
  Output: AuthResponse,
});

const VerifyCreator = Endpoint({
  Method: 'POST',
  getPath: ({ channelId }) => `/v3/creator/${channelId}/verify`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: ContentCreator,
});

const CreatorVideos = Endpoint({
  Method: 'GET',
  getPath: () => `/v3/creator/videos`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: ContentCreatorVideosOutput,
});

const OneCreatorVideo = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v3/creator/videos/${videoId}`,
  Input: {
    Headers: AuthorizationHeader,
    Params: t.type({ videoId: t.string }),
  },
  Output: Video.Video,
});

const PullCreatorVideos = Endpoint({
  Method: 'POST',
  getPath: () => `/v3/creator/videos/repull`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: ContentCreatorVideosOutput,
});

const CreatorRecommendations = Endpoint({
  Method: 'GET',
  getPath: () => `/v3/creator/recommendations`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: Recommendation.RecommendationList,
});

const CreatorRelatedChannels = Endpoint({
  Method: 'GET',
  getPath: ({ channelId }) => `/v3/creator/${channelId}/related`,
  Input: {
    Headers: AuthorizationHeader,
    Params: t.type({ channelId: t.string }),
    Query: SearchQuery,
  },
  Output: GetRelatedChannelsOutput,
});

const UpdateVideo = Endpoint({
  Method: 'POST',
  getPath: () => `/v3/creator/updateVideo`,
  Input: {
    Headers: AuthorizationHeader,
    Body: Video.UpdateVideoBody,
  },
  Output: Video.Video,
});

const CreateRecommendation = Endpoint({
  Method: 'POST',
  getPath: () => `/v3/creator/ogp`,
  Input: {
    Headers: AuthorizationHeader,
    Body: Recommendation.CreateRecommendation,
  },
  Output: Recommendation.Recommendation,
});

// TODO: Swagger
const PatchRecommendation = Endpoint({
  Method: 'PATCH',
  getPath: ({ urlId }) => `/v3/creator/recommendations/${urlId}`,
  Input: {
    Params: t.type({ urlId: t.string }),
    Headers: AuthorizationHeader,
    Body: Recommendation.PartialRecommendation,
  },
  Output: Recommendation.Recommendation,
});

const DeleteRecommendation = Endpoint({
  Method: 'DELETE',
  getPath: ({ urlId }) => `/v3/creator/recommendations/${urlId}`,
  Input: {
    Headers: AuthorizationHeader,
    Params: t.type({ urlId: t.string }),
  },
  Output: t.boolean,
});

const GetCreatorStats = Endpoint({
  Method: 'GET',
  getPath: ({ channelId }) => `/v3/creator/${channelId}/stats`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: CreatorStats,
});

export const endpoints = {
  GetCreator,
  RegisterCreator,
  VerifyCreator,
  CreatorVideos,
  OneCreatorVideo,
  CreatorRecommendations,
  CreateRecommendation,
  PatchRecommendation,
  DeleteRecommendation,
  CreatorRelatedChannels,
  UpdateVideo,
  PullCreatorVideos,
  GetCreatorStats,
};
