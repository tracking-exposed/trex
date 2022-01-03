import { APIError } from '@shared/errors/APIError';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import { GetAPI } from '@shared/providers/api.provider';
import { available, queryStrict } from 'avenger';
import { CachedQuery } from 'avenger/lib/Query';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Metadata } from '@shared/models/Metadata';

export interface SearchRequestInput {
  Params: any;
  Query: SearchQuery;
}

export interface Results<T> {
  total: number;
  content: T[];
}

type EndpointQuery<C> = CachedQuery<SearchRequestInput, APIError, Results<C>>;

export interface TabouleQueries {
  ccRelatedUsers: EndpointQuery<ChannelRelated>;
  compareExperiment: EndpointQuery<Metadata>;
}

interface GetDataTableQueriesProps {
  baseURL: string;
  accessToken?: string;
}

export const GetDataTableQueries = ({
  baseURL,
  accessToken,
}: GetDataTableQueriesProps): TabouleQueries => {
  const { API } = GetAPI({ baseURL });

  const ccRelatedUsers = queryStrict<
    SearchRequestInput,
    APIError,
    Results<ChannelRelated>
  >(
    (input) =>
      pipe(
        API.v3.Creator.CreatorRelatedChannels({
          ...input,
          Headers: {
            'x-authorization': accessToken ?? '',
          },
        }),
        TE.map(({ totalRecommendations, ...r }) => ({
          ...r,
          total: totalRecommendations,
          content: r.content.map((r) => ({ ...r, id: r.recommendedSource })),
        }))
      ),
    available
  );

  const compareExperiment = queryStrict<
    SearchRequestInput,
    APIError,
    Results<Metadata>
  >(
    (input) =>
      pipe(
        API.v2.Public.GetExperimentById({
          ...input,
        }),
        TE.map((content) => ({ total: content.length, content }))
      ),
    available
  );

  return { ccRelatedUsers, compareExperiment };
};
