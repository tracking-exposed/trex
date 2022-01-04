import * as t from 'io-ts';
import { ContributorPersonalStats } from '../../models/contributor/ContributorPersonalStats';
import { SearchQuery } from '../../models/http/SearchQuery';
import { Endpoint } from 'ts-endpoint';
import { CreatorStats } from '../../models/CreatorStats';

const GetAuthorStatsByVideoId = Endpoint({
  Method: 'GET',
  getPath: ({ videoId }) => `/v1/author/${videoId}`,
  Input: {
    Params: t.type({ videoId: t.string }),
  },
  Output: CreatorStats,
});

const GetPersonalStatsByPublicKey = Endpoint({
  Method: 'GET',
  getPath: ({ publicKey }) => `/v1/personal/${publicKey}`,
  Input: {
    Query: SearchQuery,
    Params: t.type({ publicKey: t.string }),
  },
  Output: ContributorPersonalStats,
});

export const endpoints = {
  GetAuthorStatsByVideoId,
  GetPersonalStatsByPublicKey,
};
