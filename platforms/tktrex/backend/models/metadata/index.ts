import * as t from 'io-ts';
import { FollowingVideoMetadataDB } from './FollowingMetadata';
import { ForYouVideoMetadataDB } from './ForYouMetadata';
import { NativeMetadataDB } from './NativeMetadata';
import { ProfileMetadataDB } from './ProfileMetadata';
import { SearchMetadataDB } from './SearchMetadata';

export const TKMetadataDB = t.union(
  [
    NativeMetadataDB,
    SearchMetadataDB,
    ForYouVideoMetadataDB,
    FollowingVideoMetadataDB,
    ProfileMetadataDB,
  ],
  'MetadataDB'
);
export type TKMetadataDB = t.TypeOf<typeof TKMetadataDB>;
