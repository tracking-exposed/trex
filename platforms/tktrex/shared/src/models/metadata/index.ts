import * as t from 'io-ts';
import { MetadataBase } from './MetadataBase';
import { FollowingVideoMetadata } from './FollowingMetadata';
import { ForYouVideoMetadata } from './ForYouMetadata';
import { NativeMetadata } from './NativeMetadata';
import { ProfileMetadata } from './ProfileMetadata';
import { SearchMetadata, SearchMetadataResult } from './SearchMetadata';

export const TKMetadata = t.union(
  [
    SearchMetadata,
    ForYouVideoMetadata,
    FollowingVideoMetadata,
    NativeMetadata,
    ProfileMetadata,
  ],
  'TKMetadata',
);

export type TKMetadata = t.TypeOf<typeof TKMetadata>;

export {
  MetadataBase,
  FollowingVideoMetadata,
  ForYouVideoMetadata,
  NativeMetadata,
  SearchMetadata,
  SearchMetadataResult,
  ProfileMetadata,
};
