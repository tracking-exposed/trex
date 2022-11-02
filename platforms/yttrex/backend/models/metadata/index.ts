import { SearchMetadataDB } from './SearchMetadata';
import { VideoMetadataDB } from './VideoMetadata';
import * as t from 'io-ts';
import { HomeMetadataDB } from './HomeMetadata';
import { HashtagMetadataDB } from './HashtagMetadata';

export const MetadataDB = t.union(
  [SearchMetadataDB, VideoMetadataDB, HomeMetadataDB, HashtagMetadataDB],
  'MetadataDB'
);

export type MetadataDB = t.TypeOf<typeof MetadataDB>;
