import * as t from 'io-ts';
import { TKMetadataBase } from './MetadataBase';
import { FollowingVideoMetadata } from './FollowingMetadata';
import { ForYouMetadata } from './ForYouMetadata';
import { NativeMetadata } from './NativeMetadata';
import { ProfileMetadata } from './ProfileMetadata';
import { SearchMetadata, SearchMetadataResult } from './SearchMetadata';
import { HashtagMetadata } from './HashtagMetadata';

export const TKMetadata = t.union(
  [
    FollowingVideoMetadata,
    NativeMetadata,
    ForYouMetadata,
    SearchMetadata,
    ProfileMetadata,
    HashtagMetadata,
  ],
  'TKMetadata',
);

export type TKMetadata = t.TypeOf<typeof TKMetadata>;

export {
  TKMetadataBase,
  FollowingVideoMetadata,
  ForYouMetadata,
  NativeMetadata,
  SearchMetadata,
  SearchMetadataResult,
  ProfileMetadata,
  HashtagMetadata,
};
