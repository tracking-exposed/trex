import { APIError } from '@shared/errors/APIError';
import { SearchQuery } from '@shared/models/http/SearchQuery';
import { ListMetadataQuery } from '@yttrex/shared/models/http/metadata/query/ListMetadata.query';
import { CachedQuery } from 'avenger/lib/Query';

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

export type EndpointQuery<Q extends {}, C> = CachedQuery<Q, APIError, C>;
