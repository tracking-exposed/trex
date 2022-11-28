import { Format } from '@shared/models/common';
import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/NumberFromString';
import * as Nature from '../../Nature';

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.VideoType`
 */
export const ListVideoMetadataQuery = t.type(
  {
    nature: Nature.VideoType,
  },
  'ListVideoMetadataQuery',
);

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.SearchType`
 */
export const ListSearchMetadataQuery = t.type(
  {
    nature: Nature.SearchType,
    query: t.union([t.string, t.undefined]),
  },
  'ListSearchMetadataQuery',
);

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.NativeType`
 */
export const ListNativeMetadataQuery = t.type(
  {
    nature: Nature.NativeType,
    description: t.union([t.string, t.undefined]),
  },
  'ListNativeMetadataQuery',
);

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.ProfileType`
 */
export const ListProfileMetadataQuery = t.type(
  {
    nature: Nature.ProfileType,
  },
  'ListProfileMetadataQuery',
);

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.ForYouType`
 */
export const ListForYouMetadataQuery = t.type(
  {
    nature: Nature.ForYouType,
    description: t.union([t.string, t.undefined]),
  },
  'ListProfileMetadataQuery',
);

/**
 * The codec for the Query `filter` for GET /v2/metadata endpoint
 * when filter[nature] = `Nature.HashtagType`
 */
export const ListHashtagMetadataQuery = t.type(
  {
    nature: Nature.HashtagType,
    tag: t.union([t.string, t.undefined]),
  },
  'ListHashtagMetadataQuery',
);

/**
 * The codec for the Query used for GET /v2/metadata endpoint
 */
export const ListMetadataQuery = t.partial(
  {
    publicKey: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    researchTag: t.union([t.string, t.undefined]),
    amount: t.union([NumberFromString, t.number, t.undefined]),
    skip: t.union([NumberFromString, t.number, t.undefined]),
    format: t.union([Format, t.undefined]),
    // we want the filter to be specific for
    // the nature given
    filter: t.union([
      t.union([
        ListVideoMetadataQuery,
        ListSearchMetadataQuery,
        ListNativeMetadataQuery,
        ListProfileMetadataQuery,
        ListForYouMetadataQuery,
        ListHashtagMetadataQuery,
      ]),
      t.undefined,
    ]),
  },
  'ListMetadataQuery',
);

export type ListMetadataQuery = t.TypeOf<typeof ListMetadataQuery>;
