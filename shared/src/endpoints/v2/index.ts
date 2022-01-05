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

const SearchesAsCSV = Endpoint({
  Method: 'GET',
  getPath: ({ queryString }) => `/v2/searches/${queryString}/csv`,
  Input: {
    Params: t.type({ queryString: t.string }),
  },
  Output: t.any,
});

const GetPersonalCSV = Endpoint({
  Method: 'GET',
  getPath: ({ publicKey, type }) => `/v2/personal/${publicKey}/${type}/csv`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      type: t.union([
        t.literal('home'),
        t.literal('video'),
        t.literal('search'),
      ]),
    }),
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
    Query: SearchQuery,
  },
  Output: t.strict({
    active: t.array(
      t.strict({
        publicKey: t.string,
        href: t.string,
        experimentId: t.string,
      })
    ),
    configured: t.array(GuardoniExperiment),
    recent: t.record(
      t.string,
      t.strict({
        contributions: t.record(t.string, t.number),
        profiles: t.record(t.string, t.number),
      })
    ),
  }),
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

const DeletePersonalContributionByPublicKey = Endpoint({
  Method: 'DELETE',
  getPath: ({ publicKey, selector }) =>
    `/v2/personal/${publicKey}/selector/id/${selector}`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      selector: t.union([t.string, t.undefined]),
    }),
  },
  Output: t.strict({
    success: t.boolean,
    result: t.strict({
      metadata: t.strict({
        acknowledged: t.boolean,
        deletedCount: t.number,
      }),
    }),
  }),
});

export default {
  Public: {
    CompareVideo,
    VideoRelated,
    VideoAuthor,
    Searches,
    SearchesAsCSV,
    AddEvents,
    GetChannelADVStats,
    GetExperimentList,
    GetExperimentById,
    GetPersonalCSV,
    DeletePersonalContributionByPublicKey,
  },
};
