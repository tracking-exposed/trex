import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';
import {
  ADVContributionEvent,
  VideoContributionEvent,
} from '../../models/ContributionEvent';
import { SearchQuery } from '../../models/http/SearchQuery';
import { GuardoniExperiment, Metadata } from '../../models/Metadata';
import { ChannelADVStats } from '../../models/stats/ChannelADV';

const CompareVideo = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v2/compare/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const VideoRelated = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v2/related/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const VideoAuthor = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v2/author/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: t.any,
});

const Searches = Endpoint({
  Method: 'GET',
  getPath: ({ queryString }) => `/v2/searches/${queryString}`,
  Input: {
    Params: t.type({ queryString: t.string }),
  },
  Output: t.any,
});

const AddEvents = Endpoint({
  Method: 'POST',
  getPath: () => `/v2/events`,
  Input: {
    Headers: t.type({
      'X-YTtrex-Version': t.string,
      'X-YTtrex-Build': t.string,
      'X-YTtrex-PublicKey': t.string,
      'X-YTtrex-Signature': t.string,
    }),
    Body: t.array(t.union([VideoContributionEvent, ADVContributionEvent])),
  },
  Output: t.any,
});

const GetChannelADVStats = Endpoint({
  Method: 'GET',
  getPath: ({ channelId }) => `/v2/ad/channel/${channelId}`,
  Input: {
    Query: t.type({
      since: t.string,
      till: t.string,
    }),
    Params: t.type({
      channelId: t.string,
    }),
  },
  Output: t.array(ChannelADVStats),
});

const GetExperimentList = Endpoint({
  Method: 'GET',
  getPath: ({ type, key }) => `/v2/guardoni/list/${type}/${key}`,
  Input: {
    Params: t.type({
      type: t.union([t.literal('comparison'), t.literal('chiaroscuro')]),
      key: t.string,
    }),
  },
  Output: t.array(GuardoniExperiment),
});

const GetExperimentById = Endpoint({
  Method: 'GET',
  getPath: ({ experimentId }) => `/v2/experiment/${experimentId}/json`,
  Input: {
    Query: SearchQuery,
    Params: t.type({
      experimentId: t.string,
    }),
  },
  Output: t.array(Metadata),
});

export default {
  Public: {
    CompareVideo,
    VideoRelated,
    VideoAuthor,
    Searches,
    AddEvents,
    GetChannelADVStats,
    GetExperimentList,
    GetExperimentById,
  },
};
