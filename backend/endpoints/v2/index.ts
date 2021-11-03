import * as t from "io-ts";
import { Endpoint } from "ts-endpoint";
import { ContributionEvent } from "../../models/ContributionEvent";

const CompareVideo = Endpoint({
  Method: "GET",
  getPath: ({ videoId }) => `/v2/compare/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const VideoRelated = Endpoint({
  Method: "GET",
  getPath: ({ videoId }) => `/v2/related/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const VideoAuthor = Endpoint({
  Method: "GET",
  getPath: ({ videoId }) => `/v2/author/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const Searches = Endpoint({
  Method: "GET",
  getPath: ({ queryString }) => `/v2/searches/${queryString}`,
  Input: {
    Params: t.type({ queryString: t.string }),
  },
  Output: t.any,
});

const AddEvents = Endpoint({
  Method: "POST",
  getPath: () => `/v2/events`,
  Input: {
    Headers: t.type({
      "X-YTtrex-Version": t.string,
      "X-YTtrex-Build": t.string,
      "X-YTtrex-PublicKey": t.string,
      "X-YTtrex-Signature": t.string,
    }),
    Body: t.array(ContributionEvent),
  },
  Output: t.any,
});

const Endpoints = {
  CompareVideo,
  VideoRelated,
  VideoAuthor,
  Searches,
  AddEvents,
};

type Endpoints = typeof Endpoints;

export { Endpoints as V2 };
