import { SearchMetadataDB } from './SearchMetadata';
import { VideoMetadataDB } from './VideoMetadata';
import * as t from 'io-ts';
import { HomeMetadataDB } from './HomeMetadata';

export const MetadataDB = t.union(
  [SearchMetadataDB, VideoMetadataDB, HomeMetadataDB],
  'MetadataDB'
);

export type MetadataDB = t.TypeOf<typeof MetadataDB>;
