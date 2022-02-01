import { APIError } from '@trex/shared/errors/APIError';
import { ChannelRelated } from '@trex/shared/models/ChannelRelated';
import {
  HomeMetadata,
  SearchMetadata,
  VideoMetadata,
} from '@trex/shared/models/contributor/ContributorPersonalStats';
import {
  TikTokPSearchMetadata,
  SummaryHTMLMetadata,
  // SummaryMetadata,
} from '@trex/shared/models/contributor/ContributorPersonalSummary';
import { SearchQuery } from '@trex/shared/models/http/SearchQuery';
import { TikTokSearchMetadata } from '@trex/shared/models/http/tiktok/TikTokSearch';
import { Metadata } from '@trex/shared/models/Metadata';
import { GuardoniExperiment } from '@trex/shared/models/Experiment';
import { GetAPI } from '@trex/shared/providers/api.provider';
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
  getExperimentById: EndpointQuery<Metadata>;
  getExperimentList: EndpointQuery<GuardoniExperiment>;
  personalSearches: EndpointQuery<SearchMetadata>;
  personalAds: EndpointQuery<any>;
  personalHomes: EndpointQuery<HomeMetadata>;
  personalVideos: EndpointQuery<VideoMetadata>;
  // tik tok
  tikTokPersonalHTMLSummary: EndpointQuery<SummaryHTMLMetadata>;
  tikTokPersonalSearch: EndpointQuery<TikTokPSearchMetadata>;
  tikTokSearches: EndpointQuery<TikTokSearchMetadata>;
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

  const getExperimentById = queryStrict<
    SearchRequestInput,
    APIError,
    Results<Metadata>
  >(
    (input) =>
      pipe(
        API.v2.Public.GetExperimentById(input),
        TE.map((content) => ({ total: content.length, content }))
      ),
    available
  );

  const getExperimentList = queryStrict<
    SearchRequestInput,
    APIError,
    Results<GuardoniExperiment>
  >(
    (input) =>
      pipe(
        API.v2.Public.GetExperimentList(input),
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

  const personalHomes = queryStrict<
    SearchRequestInput,
    APIError,
    Results<HomeMetadata>
  >(
    (input) =>
      pipe(
        API.v1.Public.GetPersonalStatsByPublicKey(input),
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
        API.v1.Public.GetPersonalStatsByPublicKey(input),
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
        API.v1.Public.GetPersonalStatsByPublicKey(input),
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
        API.v1.Public.GetPersonalStatsByPublicKey(input),
        TE.map((content) => ({
          total: content.stats.search,
          content: content.searches,
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
        API.v1.Public.GetPersonalSummaryByPublicKey(input),
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
        API.v1.Public.GetPersonalSearchByPublicKey(input),
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
    Results<TikTokSearchMetadata>
  >(
    ({ Params, ...input }) =>
      pipe(
        API.v2.Public.TikTokSearches({ ...input }),
        TE.map((content) => ({
          total: content.length,
          content: content,
        }))
      ),
    available
  );

  return {
    ccRelatedUsers,
    getExperimentById,
    getExperimentList,
    personalHomes,
    personalAds,
    personalVideos,
    personalSearches,
    tikTokPersonalHTMLSummary,
    tikTokPersonalSearch,
    tikTokSearches,
  };
};
