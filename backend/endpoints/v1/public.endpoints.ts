import * as t from "io-ts";
import { Endpoint } from "ts-endpoint";
import { CreatorStats } from "../../models/CreatorStats";

const GetAuthorStatsByVideoId = Endpoint({
  Method: "GET",
  getPath: ({videoId}) => `/v1/author/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: CreatorStats,
});

export const endpoints = {
  GetAuthorStatsByVideoId,
};
