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
import { Step } from '@shared/models/Step';
import { MakeAPIClient } from '@shared/providers/api.provider';
import * as tkEndpoints from '@tktrex/shared/endpoints';
import { GetSearchByQueryInputParams } from '@tktrex/shared/models/http/Search';
import { SearchMetadata as TKSearchMetadata } from '@tktrex/shared/models/metadata';
import * as endpoints from '@yttrex/shared/endpoints';
import { ListMetadataQuery } from '@yttrex/shared/endpoints/v2/metadata.endpoints';
import { available, queryStrict, refetch } from 'avenger';
import { CachedQuery } from 'avenger/lib/Query';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

export interface SearchRequestInput {
  Params: undefined;
  Query: SearchQuery & { publicKey: string };
}

export interface RequestInputWithPublicKeyParam {
  Params: { publicKey: string };
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

export type EndpointQuery<Q extends {}, C> = CachedQuery<
  Q,
  APIError,
  Results<C>
>;

export interface TabouleQueries {
  YCAIccRelatedUsers: EndpointQuery<
    Omit<SearchRequestInput, 'Params'> & { Params: { channelId: string } },
    ChannelRelated
  >;
  youtubeGetExperimentById: EndpointQuery<
    SearchRequestInput & { Params: { experimentId: string } },
    Step
  >;
  youtubeGetExperimentList: EndpointQuery<
    SearchRequestInput,
    GuardoniExperiment
  >;
  youtubePersonalSearches: EndpointQuery<SearchRequestInput, SearchMetadata>;
  youtubePersonalAds: EndpointQuery<RequestInputWithPublicKeyParam, any>;
  youtubePersonalHomes: EndpointQuery<SearchRequestInput, HomeMetadata>;
  youtubePersonalVideos: EndpointQuery<SearchRequestInput, VideoMetadata>;
  // tik tok
  tikTokPersonalHTMLSummary: EndpointQuery<any, SummaryHTMLMetadata>;
  tikTokPersonalSearch: EndpointQuery<
    RequestInputWithPublicKeyParam,
    TikTokPSearchMetadata
  >;
  tikTokSearches: EndpointQuery<any, TKSearchMetadata>;
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
    Omit<SearchRequestInput, 'Params'> & { Params: { channelId: string } },
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
    SearchRequestInput & { Params: { experimentId: string } },
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
            ...(input.Query as any),
            amount: (input.Query.amount + '') as any,
            skip: (input.Query.skip + '') as any,
            format: 'json',
            nature: 'home',
          },
        }),
        TE.map((content) => ({
          total: content.totals.home,
          content: content.data as any[] as HomeMetadata[],
        }))
      ),
    available
  );

  const youtubePersonalAds = queryStrict<
    RequestInputWithPublicKeyParam,
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
            ...(input.Query as any),
            amount: (input.Query.amount + '') as any,
            skip: (input.Query.skip + '') as any,
            format: 'json',
            nature: 'video',
          },
        }),
        TE.map((content) => ({
          total: content.totals.video,
          content: content.data as any[] as VideoMetadata[],
        }))
      ),
    refetch
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
            ...(input.Query as any),
            amount: (input.Query.amount + '') as any,
            skip: (input.Query.skip + '') as any,
            format: 'json',
            nature: 'search',
          },
        }),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as SearchMetadata[],
        }))
      ),
    refetch
  );

  const tikTokPersonalHTMLSummary = queryStrict<
    RequestInputWithPublicKeyParam,
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
    refetch
  );

  const tikTokPersonalSearch = queryStrict<
    RequestInputWithPublicKeyParam,
    APIError,
    Results<TikTokPSearchMetadata>
  >(
    (input) =>
      pipe(
        TK_API.v2.Personal.GetPersonalJSON({
          Params: {
            ...input.Params,
            what: 'search',
          },
        }),
        TE.map((content) => ({
          total: content.total,
          content: content.content as any[],
        }))
      ),
    available
  );

  const tikTokSearches = queryStrict<
    { Params: GetSearchByQueryInputParams; Query: SearchQuery },
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
