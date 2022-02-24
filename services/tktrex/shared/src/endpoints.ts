import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';
import * as apiModel from './models/api';
import { DocumentedEndpoint } from '@shared/endpoints/utils';
import * as path from 'path';

const GetPersonalJSON = Endpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/json`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.What, // might be enum "foryou|following|..."
    }),
  },
  Output: apiModel.PersonalVideoList,
});

const GetPersonalCSV = Endpoint({
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/csv`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: apiModel.What,
    }),
  },
  Output: t.string,
});

// ****
// TODO: the personal searches should become a different endpoint because the output format differs
// ****

const GetSearches = DocumentedEndpoint(
  {
    Method: 'GET',
    getPath: () => '/v2/searches',
    Output: apiModel.PublicSearchList,
  },
  path.resolve(__dirname, './tik-tok-searches.md'),
);

const GetSearchByQuery = Endpoint({
  Method: 'GET',
  getPath: ({ query, format }) => `/api/v2/public/query/${query}/${format}`,
  Input: {
    Params: t.type({
      query: apiModel.What,
      format: apiModel.Format,
    }),
  },
  Output: apiModel.GetSearchByQueryOutput,
});

const GetQueryList = Endpoint({
  Method: 'GET',
  getPath: () => '/api/v2/public/queries/list',
  Output: apiModel.GetQueryListOutput,
});

export default {
  GetPersonalJSON,
  GetPersonalCSV,
  GetSearches,
  GetSearchByQuery,
  GetQueryList,
};
