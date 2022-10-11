import { getArbitrary } from 'fast-check-io-ts';
import {
  SearchMetadata,
  ForYouVideoMetadata,
  FollowingVideoMetadata,
  MetadataBase,
  SearchMetadataResult,
  NativeMetadata,
} from '../models/Metadata';
import { propsOmitType } from '@shared/utils/arbitrary.utils';
import { fc } from '@shared/test';
import { subDays } from 'date-fns';
import * as t from 'io-ts';

const metadataBaseProps = propsOmitType(MetadataBase, ['id', 'savingTime']);

/**
 * Native metadata arbitrary
 */

const nativeMetadataProps = propsOmitType(NativeMetadata.types[3], []);

export const NativeMetadataArb: fc.Arbitrary<NativeMetadata> = getArbitrary(
  t.type({
    ...metadataBaseProps,
    ...NativeMetadata.types[1].type.props,
    ...nativeMetadataProps,
  })
).map(({ videoId, authorId, ...n }) => {
  return {
    ...n,
    videoId,
    authorId,
    id: fc.sample(fc.uuid(), 1)[0],
    nature: { type: 'native', videoId, authorId },
    savingTime: fc.sample(fc.date(), 1)[0].toISOString(),
  };
});

/**
 * Search metadata results
 */

const searchMetadataResultProps = propsOmitType(SearchMetadataResult, [
  // 'linked',
  // 'video',
]);
export const SearchMetadataResultArb = getArbitrary(
  t.strict({
    ...searchMetadataResultProps,
  })
).map((s) => ({
  ...s,
  publishingDate: fc.sample(
    fc.date().map((d) => d.toISOString()),
    1
  )[0],
}));

/**
 * SearchMetadata arbitrary
 *
 **/

const searchMetadataProps = propsOmitType(SearchMetadata.types[3], [
  'results',
  'thumbnails',
]);

export const SearchMetaDataArb = (opts: {
  results: number;
}): fc.Arbitrary<SearchMetadata> =>
  getArbitrary(
    t.intersection([t.type(metadataBaseProps), t.type(searchMetadataProps)])
  ).map((ad) => {
    const nature = {
      type: 'search' as const,
      query: fc.sample(fc.uuid(), 1)[0],
    };
    return {
      ...ad,
      nature,
      ...nature,
      id: fc.sample(fc.uuid(), 1)[0],
      savingTime: subDays(
        new Date(),
        fc.sample(fc.oneof(fc.constant(5), fc.constant(10)), 1)[0]
      ).toISOString(),
      clientTime: fc.sample(fc.date(), 1)[0],
      results: fc.sample(SearchMetadataResultArb, opts.results),
      thumbnails: [],
    };
  });

/**
 * ForYouMetadata arbitrary
 *
 **/
const forYouMetadataProps = propsOmitType(ForYouVideoMetadata.types[2], []);

export const ForYouVideoMetaDataArb = getArbitrary(
  t.intersection([t.type(metadataBaseProps), t.type(forYouMetadataProps)])
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: subDays(new Date(), fc.sample(fc.nat(), 1)[0]),
  clientTime: fc.sample(fc.date(), 1)[0],
}));

/**
 * FollowingVideoMetadata arbitrary
 *
 **/
const followingVideoMetadataProps = propsOmitType(
  FollowingVideoMetadata.types[1],
  []
);

export const FollowingVideoMetaDataArb = getArbitrary(
  t.intersection([
    t.type(metadataBaseProps),
    t.type(followingVideoMetadataProps),
  ])
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: subDays(new Date(), fc.sample(fc.nat(), 1)[0]),
  clientTime: fc.sample(fc.date(), 1)[0],
}));

export const MetadataArb = fc.oneof(
  SearchMetaDataArb({ results: 10 }),
  ForYouVideoMetaDataArb,
  FollowingVideoMetaDataArb,
  NativeMetadataArb
);
