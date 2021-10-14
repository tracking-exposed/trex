import { Endpoint } from "ts-endpoint";
import * as t from "io-ts";
import { AuthResponse } from "../../models/Auth";
import { ContentCreator } from "../../models/ContentCreator";
import { Recommendation } from "../../models/Recommendation";
import { Video } from "../../models/Video";

const ChannelType = t.literal("channel");

const GetCreator = Endpoint({
  Method: "GET",
  getPath: () => `/v3/creator/me`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: ContentCreator,
});

const RegisterCreator = Endpoint({
  Method: "POST",
  getPath: ({ channelId }) => `/v3/creator/${channelId}/register`,
  Input: {
    Params: t.type({ channelId: t.string, type: t.literal("channel") }),
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
  Output: AuthResponse,
});

const CreatorVideos = Endpoint({
  Method: "GET",
  getPath: ({ channelId }) => `/v3/creator/videos/${channelId}`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: t.array(Video),
});

const CreatorRecommendations = Endpoint({
  Method: "GET",
  getPath: ({ channelId }) => `/v3/creator/recommendations/${channelId}`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: t.array(Recommendation),
});

const CreatorRelatedChannels = Endpoint({
  Method: "GET",
  getPath: ({ channelId, amount, skip }) =>
    `/v3/creator/${channelId}/related/${amount}-${skip}`,
  Input: {
    Params: t.type({ channelId: t.string, amount: t.number, skip: t.number }),
  },
  Output: t.strict({ content: t.array(ContentCreator) }),
});

const UpdateVideo = Endpoint({
  Method: "POST",
  getPath: () => `/v3/creator/updateVideo`,
  Input: {
    Body: t.type({
      creatorId: t.string,
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
    Body: t.type({ url: t.string }),
  },
  Output: Recommendation,
});

export const endpoints = {
  GetCreator,
  RegisterCreator,
  VerifyCreator,
  CreatorVideos,
  CreatorRecommendations,
  CreatorRelatedChannels,
  UpdateVideo,
  CreateRecommendation
};
