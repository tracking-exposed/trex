import { DocumentedEndpoint } from '@shared/endpoints';
import { ListOutput } from '@shared/models/http/Output';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import * as t from 'io-ts';
import * as apiModel from '../../models';

export const Handshake = DocumentedEndpoint({
  title: 'Handshake',
  description: 'Authenticate the extension by given `publicKey`',
  tags: [],
  Method: 'POST',
  getPath: () => '/v2/handshake',
  Input: {
    Body: t.any,
  },
  Output: t.any,
});

const AddEvents = DocumentedEndpoint({
  Method: 'POST',
  getPath: () => '/v2/events',
  Input: {
    Headers: apiModel.http.Headers.TKHeaders,
    Body: t.array(apiModel.Events.HTMLContributionEvent),
  },
  Output: t.any,
  title: 'Add contribution events',
  description: '',
  tags: ['events'],
});

const AddAPIEvents = DocumentedEndpoint({
  Method: 'POST',
  getPath: () => '/v2/apiEvents',
  Input: {
    Headers: apiModel.http.Headers.TKHeaders,
    Body: t.array(apiModel.APIRequest.APIRequestContributionEvent),
  },
  Output: t.any,
  title: 'Add contribution events',
  description: '',
  tags: ['events'],
});

const GETAPIEvents = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/apiEvents',
  Input: {
    Query: apiModel.http.Query.APIRequest.ListAPIRequestQuery,
  },
  Output: ListOutput(apiModel.APIRequest.APIRequest, 'APIRequestList'),
  title: 'GET API Request List',
  description: '',
  tags: ['events'],
});

const GetSearches = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/searches',
  Output: apiModel.Public.PublicSearchList,
  title: 'All searches',
  description: 'Get tiktok searches',
  tags: ['searches'],
});

const GetSearchByQuery = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ query, format }) => `/v2/public/query/${query}/${format}`,
  Input: {
    Params: apiModel.http.Query.Search.GetSearchByQueryInputParams,
    Query: SearchQuery,
  },
  Output: apiModel.Public.GetSearchByQueryOutput,
  title: 'Search by query',
  tags: ['searches'],
  description: 'Use a `query` of type `What` to filter searches',
});

const GetQueryList = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/public/queries/list',
  Output: apiModel.Public.GetQueryListOutput,
  title: 'List queries',
  description: 'List public queries',
  tags: ['searches'],
});

export default {
  AddEvents,
  AddAPIEvents,
  GETAPIEvents,
  Handshake,
  GetSearches,
  GetSearchByQuery,
  GetQueryList,
};
