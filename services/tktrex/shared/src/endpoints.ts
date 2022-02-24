import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';
import * as apiModel from './models/api';

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

const GetSearches = Endpoint({
  Method: 'GET',
  getPath: () => '/v2/public/searches',
  Output: apiModel.PublicSearchList,
});

const GetSearchByQuery = Endpoint({
  Method: 'GET',
  getPath: ({ query, format }) => `/api/v2/public/query/${query}/${format}`,
  Input: {
    Params: t.type({
      query: apiModel.What,
      format: apiModel.Format,
    }),
  },
  Output: t.union([t.string, t.array(t.any)]),
});

const GetQueryList = Endpoint({
  Method: 'GET',
  getPath: () => '/api/v2/public/queries/list',
  Output: t.any,
});

export default {
  GetPersonalJSON,
  GetPersonalCSV,
  GetSearches,
  GetSearchByQuery,
  GetQueryList,
};
