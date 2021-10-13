import { Endpoint } from "ts-endpoint";
import * as t from "io-ts";
import { AuthResponse } from "../../models/Auth";
import { ContentCreator } from "../../models/ContentCreator";
import { Recommendation } from "../../models/Recommendation";

const ChannelType = t.literal("channel");

// const SingleContentCreatorResponse = t.strict({ data: ContentCreator })
const SingleContentCreatorResponse = ContentCreator;

const GetCreator = Endpoint({
  Method: "GET",
  getPath: () => `/v3/creator/me`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: SingleContentCreatorResponse,
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

const CreatorRecommendations = Endpoint({
  Method: "GET",
  getPath: ({ channelId }) => `/v3/creator/videos/${channelId}`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: t.array(Recommendation),
});

export const endpoints = {
  GetCreator,
  RegisterCreator,
  VerifyCreator,
  CreatorRecommendations
};
