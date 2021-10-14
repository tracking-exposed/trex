import { Endpoint } from "ts-endpoint";
import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";
import { Recommendation } from "../../models/Recommendation";

const Handshake = Endpoint({
  Method: "POST",
  getPath: () => `/v3/handshake`,
  Input: {
    Body: t.type(
      {
        config: t.strict({
          publicKey: t.string,
        }),

        href: t.string,
        experimentId: t.string,
        evidencetag: t.string,
        execount: t.string,
        newProfile: t.string,
        testTime: DateFromISOString,
        directiveType: t.string,
      },
      "HandshakeBody"
    ),
  },
  Output: t.any,
});


const VideoRecommendations = Endpoint({
  Method: "GET",
  getPath: ({ videoId }) => `/v3/video/${videoId}/recommendations`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.array(Recommendation),
});

const GetRecommendations = Endpoint({
  Method: "POST",
  getPath: ({ ids }) => `/v3/recommendations/${ids}`,
  Input: {
    Params: t.type({ ids: t.string }),
  },
  Output: t.array(Recommendation),
});

export const endpoints = {
  Handshake,
  GetRecommendations,
  VideoRecommendations,
};
