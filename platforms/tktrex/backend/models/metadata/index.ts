import * as t from 'io-ts';
import { FollowingVideoMetadataDB } from './FollowingMetadata';
import { ForYouMetadataDB } from './ForYouMetadata';
import { HashtagMetadataDB } from './HashtagMetadata';
import { NativeMetadataDB } from './NativeMetadata';
import { ProfileMetadataDB } from './ProfileMetadata';
import { SearchMetadataDB } from './SearchMetadata';

export const TKMetadataDB = t.union(
  [
    FollowingVideoMetadataDB,
    NativeMetadataDB,
    SearchMetadataDB,
    ForYouMetadataDB,
    ProfileMetadataDB,
    HashtagMetadataDB,
  ],
  'MetadataDB'
);
export type TKMetadataDB = t.TypeOf<typeof TKMetadataDB>;

export {
  ProfileMetadataDB,
  NativeMetadataDB,
  SearchMetadataDB,
  FollowingVideoMetadataDB,
  ForYouMetadataDB,
  HashtagMetadataDB,
};
