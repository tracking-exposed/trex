import { getArbitrary } from 'fast-check-io-ts';
import {
  SearchMetadata,
  ForYouVideoMetadata,
  FollowingVideoMetadata,
  MetadataBase,
} from '../models/Metadata';
import { propsOmitType } from '@shared/utils/arbitrary.utils';
import { fc } from '@shared/test';
import { subDays } from 'date-fns';
import * as t from 'io-ts';

const metadataBaseProps = propsOmitType(MetadataBase, ['id', 'savingTime']);

/**
 * SearchMetadata arbitrary
 *
 **/

const searchMetadataProps = propsOmitType(SearchMetadata.types[2], [
  'results',
  'thumbnails',
]);

export const SearchMetaDataArb = getArbitrary(
  t.intersection([t.type(metadataBaseProps), t.type(searchMetadataProps)]),
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: subDays(new Date(), fc.sample(fc.nat(), 1)[0]),
  clientTime: fc.sample(fc.date(), 1)[0],
  results: [],
  thumbnails: [],
}));

/**
 * ForYouMetadata arbitrary
 *
 **/
const forYouMetadataProps = propsOmitType(ForYouVideoMetadata.types[2], []);

export const ForYouVideoMetaDataArb = getArbitrary(
  t.intersection([t.type(metadataBaseProps), t.type(forYouMetadataProps)]),
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
  [],
);

export const FollowingVideoMetaDataArb = getArbitrary(
  t.intersection([
    t.type(metadataBaseProps),
    t.type(followingVideoMetadataProps),
  ]),
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: subDays(new Date(), fc.sample(fc.nat(), 1)[0]),
  clientTime: fc.sample(fc.date(), 1)[0],
}));

export const MetadataArb = fc.oneof(
  SearchMetaDataArb,
  ForYouVideoMetaDataArb,
  FollowingVideoMetaDataArb,
);
