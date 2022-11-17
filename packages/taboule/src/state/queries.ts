import { APIError } from '@shared/errors/APIError';
import { ChannelRelated } from '@shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@shared/models/contributor/ContributorPersonalStats';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { MakeAPIClient } from '@shared/providers/api.provider';
import * as tkEndpoints from '@tktrex/shared/endpoints';
import {
  ForYouMetadata as TKForYouMetadata,
  NativeMetadata as TKNativeMetadata,
  ProfileMetadata as TKProfileMetadata,
  SearchMetadata as TKSearchMetadata,
} from '@tktrex/shared/models/metadata';
import {
  ForYouType,
  NativeType,
  ProfileType,
  SearchType,
} from '@tktrex/shared/models/Nature';
import * as endpoints from '@yttrex/shared/endpoints';
import { ListMetadataQuery } from '@yttrex/shared/models/http/metadata/query/ListMetadata.query';
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
  // youtubeGetExperimentById: EndpointQuery<
  //   SearchRequestInput & { Params: { experimentId: string } },
  //   Step
  // >;
  youtubeGetExperimentList: EndpointQuery<
    SearchRequestInput,
    GuardoniExperiment
  >;
  youtubePersonalSearches: EndpointQuery<
    ListMetadataRequestInput,
    SearchMetadata
  >;
  youtubePersonalAds: EndpointQuery<RequestInputWithPublicKeyParam, any>;
  youtubePersonalHomes: EndpointQuery<ListMetadataRequestInput, HomeMetadata>;
  youtubePersonalVideos: EndpointQuery<ListMetadataRequestInput, VideoMetadata>;
  // tik tok
  // tikTokPersonalHTMLSummary: EndpointQuery<any, SummaryHTMLMetadata>;
  tikTokPersonalSearch: EndpointQuery<
    ListMetadataRequestInput,
    TKSearchMetadata
  >;
  tikTokPersonalNative: EndpointQuery<
    ListMetadataRequestInput,
    TKNativeMetadata
  >;
  tikTokPersonalForYou: EndpointQuery<
    ListMetadataRequestInput,
    TKForYouMetadata
  >;
  tikTokPersonalProfile: EndpointQuery<
    ListMetadataRequestInput,
    TKProfileMetadata
  >;
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

  // const youtubeGetExperimentById = queryStrict<
  //   SearchRequestInput & { Params: { experimentId: string } },
  //   APIError,
  //   Results<Step>
  // >(
  //   (input) =>
  //     pipe(
  //       YTAPI.v2.Public.GetExperimentById(input),
  //       TE.map((content) => ({
  //         total: content.steps.length,
  //         content: content.steps,
  //       }))
  //     ),
  //   available
  // );

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
    ListMetadataRequestInput,
    APIError,
    Results<HomeMetadata>
  >(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            amount: (amount + '') as any,
            skip: (skip + '') as any,
            format: 'json',
            filter,
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
    ListMetadataRequestInput,
    APIError,
    Results<VideoMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...input.Query,
            amount: (input.Query.amount + '') as any,
            skip: (input.Query.skip + '') as any,
            format: 'json',
            filter: {
              nature: 'video',
              title: undefined,
              authorName: undefined,
            },
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
    ListMetadataRequestInput,
    APIError,
    Results<SearchMetadata>
  >(
    (input) =>
      pipe(
        YTAPI.v2.Metadata.ListMetadata({
          Query: {
            ...input.Query,
            amount: (input.Query.amount + '') as any,
            skip: (input.Query.skip + '') as any,
            format: 'json',
            filter: {
              nature: 'search',
              query: undefined,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as SearchMetadata[],
        }))
      ),
    refetch
  );

  // const tikTokPersonalHTMLSummary = queryStrict<
  //   RequestInputWithPublicKeyParam,
  //   APIError,
  //   Results<SummaryHTMLMetadata>
  // >(
  //   (input) =>
  //     pipe(
  //       YTAPI.v1.Public.GetPersonalSummaryByPublicKey(input),
  //       TE.map((content) => ({
  //         total: content.htmls.length,
  //         content: content.htmls,
  //       }))
  //     ),
  //   refetch
  // );

  const tikTokPersonalSearch = queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<TKSearchMetadata>
  >(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        TK_API.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            amount,
            skip,
            filter: {
              query: undefined,
              ...filter,
              nature: SearchType.value,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as TKSearchMetadata[],
        }))
      ),
    available
  );

  const tikTokPersonalNative = queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<TKNativeMetadata>
  >(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        TK_API.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            amount,
            skip,
            filter: {
              description: undefined,
              ...filter,
              nature: NativeType.value,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data as any[] as TKNativeMetadata[],
        }))
      ),
    available
  );

  const tikTokPersonalProfile = queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<TKProfileMetadata>
  >(
    ({ Query: { filter, ...query } }) =>
      pipe(
        TK_API.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            filter: {
              ...filter,
              nature: ProfileType.value,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data as any[] as TKProfileMetadata[],
        }))
      ),
    available
  );

  const tikTokPersonalForYou = queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<TKForYouMetadata>
  >(
    ({ Query: { filter, ...query } }) =>
      pipe(
        TK_API.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            filter: {
              description: undefined,
              ...filter,
              nature: ForYouType.value,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data as any[] as TKForYouMetadata[],
        }))
      ),
    available
  );

  return {
    YCAIccRelatedUsers,
    // youtubeGetExperimentById,
    youtubeGetExperimentList,
    youtubePersonalHomes,
    youtubePersonalAds,
    youtubePersonalVideos,
    youtubePersonalSearches,
    // tikTokPersonalHTMLSummary,
    tikTokPersonalSearch,
    tikTokPersonalNative,
    tikTokPersonalProfile,
    tikTokPersonalForYou,
  };
};
