import * as t from 'io-ts';
import * as apiModel from './models/api';
import { DocumentedEndpoint } from '@shared/endpoints/utils';
import * as path from 'path';

const GetPersonalJSON = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/json`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.What, // might be enum "foryou|following|..."
    }),
  },
  Output: apiModel.PersonalVideoList,
  title: 'Personal data (json)',
  description: 'Get your personal data as JSON.',
  tags: ['personal'],
});

const GetPersonalCSV = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/csv`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.What,
    }),
  },
  Output: t.string,
  title: 'Personal data (csv)',
  description: 'Download your personal data as CSV.',
  tags: ['personal'],
});

// ****
// TODO: the personal searches should become a different endpoint because the output format differs
// ****

const GetSearches = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/searches',
  Output: apiModel.PublicSearchList,
  title: 'All searches',
  description: { path: path.resolve(__dirname, './tik-tok-searches.md') },
  tags: ['searches'],
});

const GetSearchByQuery = DocumentedEndpoint({
  Method: 'GET',
  getPath: ({ query, format }) => `/v2/public/query/${query}/${format}`,
  Input: {
    Params: t.type({
      query: apiModel.What,
      format: apiModel.Format,
    }),
  },
  Output: apiModel.GetSearchByQueryOutput,
  title: 'Search by query',
  tags: ['searches'],
  description: 'Use a `query` of type `What` to filter searches',
});

const GetQueryList = DocumentedEndpoint({
  Method: 'GET',
  getPath: () => '/v2/public/queries/list',
  Output: apiModel.GetQueryListOutput,
  title: 'List queries',
  description: 'List public queries',
  tags: ['searches'],
});

export default {
  GetPersonalJSON,
  GetPersonalCSV,
  GetSearches,
  GetSearchByQuery,
  GetQueryList,
};
