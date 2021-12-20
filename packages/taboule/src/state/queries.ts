import { APIError } from "@shared/errors/APIError";
import { ChannelRelated } from "@shared/models/ChannelRelated";
import { GetAPI } from "@shared/providers/api.provider";
import { available, queryStrict } from "avenger";
import { CachedQuery } from "avenger/lib/Query";

export interface SearchQueryInput {
  Params: any;
  Query: {
    amount: number;
    skip: number;
  };
}

export interface Results<T> {
  content: T[];
}

type EndpointQuery<C> = CachedQuery<SearchQueryInput, APIError, Results<C>>;

export interface TabouleQueries {
  ccRelatedUsers: EndpointQuery<ChannelRelated>;
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
    SearchQueryInput,
    APIError,
    Results<ChannelRelated>
  >(
    (input) =>
      API.v3.Creator.CreatorRelatedChannels({
        ...input,
        Headers: {
          "x-authorization": accessToken ?? "",
        },
      }),
    available
  );

  return { ccRelatedUsers };
};
