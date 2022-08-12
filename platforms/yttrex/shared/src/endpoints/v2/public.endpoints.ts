import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';
import { AddEventsBody } from '@shared/models/ContributionEvent';
import { ContributorPublicKeyResponse } from '@shared/models/contributor/ContributorPublicKey';
import {
  GetExperimentListOutput,
  GuardoniExperiment,
} from '@shared/models/Experiment';
import { HandshakeBody, HandshakeResponse } from '@shared/models/HandshakeBody';
import { PublicKeyParams } from '@shared/models/http/params/PublicKey';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { ChannelADVStats } from '@shared/models/stats/ChannelADV';
import { DocumentedEndpoint } from '@shared/endpoints';
import { YTHeaders } from '../../models/http/YTHeaders';

export const Handshake = Endpoint({
  Method: 'POST',
  getPath: () => `/v2/handshake`,
  Input: {
    Body: HandshakeBody,
  },
  Output: HandshakeResponse,
});

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

const Searches = DocumentedEndpoint({
  title: 'Search by type',
  description: 'Search description',
  tags: ['searches'],
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
      ...PublicKeyParams.props,
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
    Headers: YTHeaders,
    Body: AddEventsBody,
  },
  Output: t.any,
});

const AddAPIEvents = Endpoint({
  Method: 'POST',
  getPath: () => `/v2/apiEvents`,
  Input: {
    Headers: YTHeaders,
    Body: AddEventsBody,
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
  getPath: () => `/v2/guardoni/list`,
  Input: {
    Query: SearchQuery,
  },
  Output: GetExperimentListOutput,
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
  Output: GuardoniExperiment,
});

const DeletePersonalContributionByPublicKey = Endpoint({
  Method: 'DELETE',
  getPath: ({ publicKey, selector }) =>
    `/v2/personal/${publicKey}/selector/id/${selector}`,
  Input: {
    Params: t.type({
      ...PublicKeyParams.props,
      selector: t.union([t.string, t.undefined]),
    }),
  },
  Output: ContributorPublicKeyResponse,
});

const Public = {
  Handshake,
  CompareVideo,
  VideoRelated,
  VideoAuthor,
  Searches,
  SearchesAsCSV,
  AddEvents,
  AddAPIEvents,
  GetChannelADVStats,
  GetExperimentList,
  GetExperimentById,
  GetPersonalCSV,
  DeletePersonalContributionByPublicKey,
};

export default Public;
