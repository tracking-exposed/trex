import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';
import * as model from './modelsAll';


const GetPersonalJSON = Endpoint({
  // '/api/v2/personal/:publicKey/:what/json',
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/json`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: t.string // might be enum "foryou|following|..."
    }),
  },
  Output: PersonalVideoList
});

const GetPersonalCSV = Endpoint({
  // '/api/v2/personal/:publicKey/:what/csv',
  Method: 'GET',
  getPath: ({ publicKey, what }) => `/v2/personal/${publicKey}/${what}/csv`,
  Input: {
    Params: t.type({
      publicKey: t.string,
      what: t.string // might be enum "foryou|following|search|..."
    }),
  },
  Output: model.CSVtext // in this case should just be a long string?
});

// ****
// TODO: the personal searches should become a different endpoint because the output format differs
// ****

const GetSearches = Endpoint({
  // '/api/v2/public/searches',
  Method: 'GET',
  getPath: () => `/v2/public/searches`,
  Output: model.PublicSearchList,
});

const GetSearchByQuery = Endpoint({
  // '/api/v2/public/query/:string/:format',
  Method: 'GET',

});

const GetQueryList = Endpoint({
  // '/api/v2/public/queries/list',
  Method: 'GET',

});

export const endpoints = {
  GetPersonalJSON,
  GetPersonalCSV,
  GetSearches,
  GetSearchByQuery,
  GetQueryList
}

