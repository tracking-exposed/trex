import * as t from "io-ts";
import { Endpoint } from "ts-endpoint";
import { AuthorizationHeader, AuthResponse } from "../../models/Auth";
import { GetRelatedChannelsOutput } from "../../models/ChannelRelated";
import { ContentCreator } from "../../models/ContentCreator";
import { CreatorStats } from "../../models/CreatorStats";
import {
  PartialRecommendation,
  Recommendation,
} from "../../models/Recommendation";
import { Video } from "../../models/Video";

const ChannelType = t.literal("channel");

const GetCreator = Endpoint({
  Method: "GET",
  getPath: () => `/v3/creator/me`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: ContentCreator,
});

const RegisterCreator = Endpoint({
  Method: "POST",
  getPath: ({ channelId }) => `/v3/creator/${channelId}/register`,
  Input: {
    Params: t.type({ channelId: t.string }),
    Body: t.type({
      type: ChannelType,
    }),
  },
  Output: AuthResponse,
});

const VerifyCreator = Endpoint({
  Method: "POST",
  getPath: ({ channelId }) => `/v3/creator/${channelId}/verify`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: ContentCreator,
});

const CreatorVideos = Endpoint({
  Method: "GET",
  getPath: () => `/v3/creator/videos`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: t.array(Video),
});

const OneCreatorVideo = Endpoint({
  Method: "GET",
  getPath: ({ videoId }) => `/v3/creator/videos/${videoId}`,
  Input: {
    Headers: AuthorizationHeader,
    Params: t.type({ videoId: t.string }),
  },
  Output: Video,
});

const PullCreatorVideos = Endpoint({
  Method: "POST",
  getPath: () => `/v3/creator/videos/repull`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: t.array(Video),
});

const CreatorRecommendations = Endpoint({
  Method: "GET",
  getPath: () => `/v3/creator/recommendations`,
  Input: {
    Headers: AuthorizationHeader,
  },
  Output: t.array(Recommendation),
});

const CreatorRelatedChannels = Endpoint({
  Method: "GET",
  getPath: ({ channelId }) => `/v3/creator/${channelId}/related`,
  Input: {
    Headers: AuthorizationHeader,
    Params: t.type({ channelId: t.string }),
    Query: t.type({ amount: t.number, skip: t.number }),
  },
  Output: GetRelatedChannelsOutput,
});

const UpdateVideo = Endpoint({
  Method: "POST",
  getPath: () => `/v3/creator/updateVideo`,
  Input: {
    Headers: AuthorizationHeader,
    Body: t.type({
      videoId: t.string,
      recommendations: t.array(t.string),
    }),
  },
  Output: Video,
});

const CreateRecommendation = Endpoint({
  Method: "POST",
  getPath: () => `/v3/creator/ogp`,
  Input: {
    Headers: AuthorizationHeader,
    Body: t.type({ url: t.string }),
  },
  Output: Recommendation,
});

// TODO: Swagger
const PatchRecommendation = Endpoint({
  Method: "PATCH",
  getPath: ({ urlId }) => `/v3/creator/recommendations/${urlId}`,
  Input: {
    Params: t.type({ urlId: t.string }),
    Headers: AuthorizationHeader,
    Body: PartialRecommendation,
  },
  Output: Recommendation,
});

const GetCreatorStats = Endpoint({
  Method: "GET",
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
  PatchRecommendation,
  CreatorRelatedChannels,
  UpdateVideo,
  CreateRecommendation,
  PullCreatorVideos,
  GetCreatorStats,
};
