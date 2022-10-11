import * as endpoints from '@yttrex/shared/endpoints';
import * as tkEndpoints from '@tktrex/shared/endpoints';
import { APIError } from '@shared/errors/APIError';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@shared/models/contributor/ContributorPersonalStats';
import {
  SummaryHTMLMetadata,
  TikTokPSearchMetadata,
} from '@shared/models/contributor/ContributorPersonalSummary';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { SearchMetadata as TKSearchMetadata } from '@tktrex/shared/models/Metadata';
import { MakeAPIClient } from '@shared/providers/api.provider';
import { available, queryStrict } from 'avenger';
import { CachedQuery } from 'avenger/lib/Query';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Step } from '@shared/models/Step';
import { ListMetadataQuery } from '@yttrex/shared/endpoints/v2/metadata.endpoints';

export interface SearchRequestInput {
  Params: any;
  Query: SearchQuery;
}

export interface ListMetadataRequestInput {
  Params: any;
  Query: ListMetadataQuery;
}

export interface Results<T> {
  total: number;
  content: T[];
}

type EndpointQuery<C> = CachedQuery<SearchRequestInput, APIError, Results<C>>;

export interface TabouleQueries {
  YCAIccRelatedUsers: EndpointQuery<ChannelRelated>;
  youtubeGetExperimentById: EndpointQuery<Step>;
  youtubeGetExperimentList: EndpointQuery<GuardoniExperiment>;
  youtubePersonalSearches: EndpointQuery<SearchMetadata>;
  youtubePersonalAds: EndpointQuery<any>;
  youtubePersonalHomes: EndpointQuery<HomeMetadata>;
  youtubePersonalVideos: EndpointQuery<VideoMetadata>;
  // tik tok
  tikTokPersonalHTMLSummary: EndpointQuery<SummaryHTMLMetadata>;
  tikTokPersonalSearch: EndpointQuery<TikTokPSearchMetadata>;
  tikTokSearches: EndpointQuery<TKSearchMetadata>;
}

interface GetTabouleQueriesProps {
  baseURL: string;
  accessToken?: string;
}

export const GetTabouleQueries = ({
  baseURL,
  accessToken,
}: GetTabouleQueriesProps): TabouleQueries => {
  const { API: YTAPI } = MakeAPIClient(
    {
      baseURL,
      getAuth: async (req) => req,
      onUnauthorized: async (res) => res,
    },
    endpoints
  );
  const { API: TK_API } = MakeAPIClient(
    {
      baseURL,
      getAuth: async (req) => req,
      onUnauthorized: async (res) => res,
    },
    tkEndpoints
  );

  const YCAIccRelatedUsers = queryStrict<
    SearchRequestInput,
    APIError,
    Results<ChannelRelated>
  >(
    (input) =>
      pipe(
        YTAPI.v3.Creator.CreatorRelatedChannels({
          ...input,
          Headers: {
            'x-authorization': accessToken ?? '',
          },
        }),
        TE.map(({ totalRecommendations, ...r }) => ({
          ...r,
          total: totalRecommendations,
        }))
      ),
    available
  );

  const youtubeGetExperimentById = queryStrict<
    SearchRequestInput,
    APIError,
    Results<Step>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Public.GetExperimentById(input),
        TE.map((content) => ({
          total: content.steps.length,
          content: content.steps,
        }))
      ),
    available
  );

  const youtubeGetExperimentList = queryStrict<
    SearchRequestInput,
    APIError,
    Results<GuardoniExperiment>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Public.GetExperimentList(input),
        TE.map((content) => {
          return {
            total: content.total,
            content: content.content.map((c) => ({
              ...c,
              id: c.experimentId,
            })),
          };
        })
      ),
    available
  );

  const youtubePersonalHomes = queryStrict<
    SearchRequestInput,
    APIError,
    Results<HomeMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...input.Query,
            amount: '20' as any,
            skip: '0' as any,
            experimentId: undefined,
            researchTag: undefined,
            format: 'json',
            nature: 'home',
            publicKey: 'H7AsuUszehN4qKTj2GYYwNNzkJVqUQBRo2wgKevzeUwx',
          },
        }),
        TE.map((content) => {
          const x = content.filter((c) => c.type === 'home');
          return x as any[] as HomeMetadata[];
        }),
        TE.map((content) => ({
          total: content.length,
          content,
        }))
      ),
    available
  );

  const youtubePersonalAds = queryStrict<
    SearchRequestInput,
    APIError,
    Results<any>
  >(
    (input) =>
      pipe(
        YTAPI.v1.Public.GetPersonalStatsByPublicKey(input),
        TE.map((content) => ({
          total: content.ads.length,
          content: content.ads,
        }))
      ),
    available
  );

  const youtubePersonalVideos = queryStrict<
    SearchRequestInput,
    APIError,
    Results<VideoMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...input.Query,
            amount: '20' as any,
            skip: '0' as any,
            experimentId: undefined,
            researchTag: undefined,
            format: 'json',
            nature: 'video',
            publicKey: 'H7AsuUszehN4qKTj2GYYwNNzkJVqUQBRo2wgKevzeUwx',
          },
        }),
        TE.map((content) => {
          const x = content.filter((c) => c.type === 'video');
          return x as any[] as VideoMetadata[];
        }),
        TE.map((content) => ({
          total: content.length,
          content,
        }))
      ),
    available
  );

  const youtubePersonalSearches = queryStrict<
    SearchRequestInput,
    APIError,
    Results<SearchMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...input.Query,
            amount: '20' as any,
            skip: '0' as any,
            experimentId: undefined,
            researchTag: undefined,
            format: 'json',
            nature: 'search',
            publicKey: 'H7AsuUszehN4qKTj2GYYwNNzkJVqUQBRo2wgKevzeUwx',
          },
        }),
        TE.map((content) => {
          const x = content.filter((c) => c.type === 'search');
          return x as any[] as SearchMetadata[];
        }),
        TE.map((content) => ({
          total: content.length ?? 0,
          content,
        }))
      ),
    available
  );

  const tikTokPersonalHTMLSummary = queryStrict<
    SearchRequestInput,
    APIError,
    Results<SummaryHTMLMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v1.Public.GetPersonalSummaryByPublicKey(input),
        TE.map((content) => ({
          total: content.htmls.length,
          content: content.htmls,
        }))
      ),
    available
  );

  const tikTokPersonalSearch = queryStrict<
    SearchRequestInput,
    APIError,
    Results<TikTokPSearchMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v1.Public.GetPersonalSearchByPublicKey(input),
        TE.map((content) => ({
          total: content.metadata.length,
          content: content.metadata,
        }))
      ),
    available
  );

  const tikTokSearches = queryStrict<
    SearchRequestInput,
    APIError,
    Results<TKSearchMetadata>
  >(
    (input) =>
      pipe(
        TK_API.v2.Public.GetSearchByQuery(input),
        TE.map((content) => ({
          total: content.length,
          content,
        }))
      ),
    available
  );

  return {
    YCAIccRelatedUsers,
    youtubeGetExperimentById,
    youtubeGetExperimentList,
    youtubePersonalHomes,
    youtubePersonalAds,
    youtubePersonalVideos,
    youtubePersonalSearches,
    tikTokPersonalHTMLSummary,
    tikTokPersonalSearch,
    tikTokSearches,
  };
};
