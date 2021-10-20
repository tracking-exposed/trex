import * as t from "io-ts";
import { Endpoint } from "ts-endpoint";
import { HandshakeBody } from "../../models/HandshakeBody";
import { GetRecommendationsParams, GetRecommendationsQuery, Recommendation } from "../../models/Recommendation";



const Handshake = Endpoint({
  Method: "POST",
  getPath: () => `/v3/handshake`,
  Input: {
    Body: HandshakeBody,
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
    Query: GetRecommendationsQuery,
    Params: GetRecommendationsParams,
  },
  Output: t.array(Recommendation),
});

export const endpoints = {
  Handshake,
  GetRecommendations,
  VideoRecommendations,
};
