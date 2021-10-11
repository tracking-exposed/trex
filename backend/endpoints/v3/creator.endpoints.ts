import { Endpoint } from "ts-endpoint";
import * as t from "io-ts";
import { AuthResponse } from "../../models/Auth";
import { ContentCreator } from "../../models/ContentCreator";

const ChannelType = t.literal("channel");

// const SingleContentCreatorResponse = t.strict({ data: ContentCreator })
const SingleContentCreatorResponse = ContentCreator;

const GetCreator = Endpoint({
  Method: "GET",
  getPath: () => `/creator/me`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: SingleContentCreatorResponse,
});

const RegisterCreator = Endpoint({
  Method: "POST",
  getPath: ({ channelId }) => `/creator/${channelId}/register`,
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
  getPath: ({ channelId }) => `/creator/${channelId}/verify`,
  Input: {
    Params: t.type({ channelId: t.string }),
  },
  Output: AuthResponse,
});

export const endpoints = {
  GetCreator,
  RegisterCreator,
  VerifyCreator,
};
