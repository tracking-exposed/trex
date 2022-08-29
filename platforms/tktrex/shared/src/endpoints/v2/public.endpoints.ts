import { DocumentedEndpoint } from '@shared/endpoints';
import { What, Format } from '@shared/models/common';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import * as t from 'io-ts';
import * as apiModel from '../../models';
import { NumberFromString } from 'io-ts-types/NumberFromString';

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
    Body: t.array(apiModel.Events.ContributionEvent),
  },
  Output: t.any,
  title: 'Add contribution events',
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
    Params: t.type({
      query: What,
      format: Format,
    }),
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

const ListMetadata = DocumentedEndpoint({
  title: 'Get metadata by research tag',
  description: '',
  tags: ['public'],
  Method: 'GET',
  getPath: () => '/v2/metadata',
  Input: {
    Query: t.type({
      experimentId: t.union([t.string, t.undefined]),
      researchTag: t.union([t.string, t.undefined]),
      amount: t.union([NumberFromString, t.undefined]),
      skip: t.union([NumberFromString, t.undefined]),
      format: t.union([Format, t.undefined]),
    }),
  },
  Output: t.array(apiModel.TKMetadata.TKMetadata),
});

export default {
  AddEvents,
  Handshake,
  GetSearches,
  GetSearchByQuery,
  GetQueryList,
  ListMetadata,
};
