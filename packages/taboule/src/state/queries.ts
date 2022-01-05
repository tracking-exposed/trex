import { APIError } from '@shared/errors/APIError';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@shared/models/contributor/ContributorPersonalStats';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { Metadata } from '@shared/models/Metadata';
import { GetAPI } from '@shared/providers/api.provider';
import { available, queryStrict } from 'avenger';
import { CachedQuery } from 'avenger/lib/Query';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

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
  personalSearches: EndpointQuery<SearchMetadata>;
  personalAds: EndpointQuery<any>;
  personalHomes: EndpointQuery<HomeMetadata>;
  personalVideos: EndpointQuery<VideoMetadata>;
}

interface GetTabouleQueriesProps {
  baseURL: string;
  accessToken?: string;
}

export const GetTabouleQueries = ({
  baseURL,
  accessToken,
}: GetTabouleQueriesProps): TabouleQueries => {
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

  const personalHomes = queryStrict<
    SearchRequestInput,
    APIError,
    Results<HomeMetadata>
  >(
    (input) =>
      pipe(
        API.v1.Public.GetPersonalStatsByPublicKey({
          ...input,
        }),
        TE.map((content) => ({
          total: content.stats.home,
          content: content.homes,
        }))
      ),
    available
  );

  const personalAds = queryStrict<SearchRequestInput, APIError, Results<any>>(
    (input) =>
      pipe(
        API.v1.Public.GetPersonalStatsByPublicKey({
          ...input,
        }),
        TE.map((content) => ({
          total: content.ads.length,
          content: content.ads,
        }))
      ),
    available
  );

  const personalVideos = queryStrict<
    SearchRequestInput,
    APIError,
    Results<VideoMetadata>
  >(
    (input) =>
      pipe(
        API.v1.Public.GetPersonalStatsByPublicKey({
          ...input,
        }),
        TE.map((content) => ({
          total: content.stats.video,
          content: content.videos,
        }))
      ),
    available
  );

  const personalSearches = queryStrict<
    SearchRequestInput,
    APIError,
    Results<SearchMetadata>
  >(
    (input) =>
      pipe(
        API.v1.Public.GetPersonalStatsByPublicKey({
          ...input,
        }),
        TE.map((content) => ({
          total: content.stats.search,
          content: content.searches,
        }))
      ),
    available
  );

  return {
    ccRelatedUsers,
    compareExperiment,
    personalHomes,
    personalAds,
    personalVideos,
    personalSearches,
  };
};
