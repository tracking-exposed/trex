import * as t from 'io-ts';
import { HomeMetadata } from './HomeMetadata';
import { SearchMetadata } from './SearchMetadata';
import { VideoMetadata } from './VideoMetadata';
import { ParsedInfo } from './VideoResult';
import { HashtagMetadata } from './HashtagMetadata';

export const Metadata = t.union(
  [VideoMetadata, HomeMetadata, SearchMetadata, HashtagMetadata],
  'Metadata'
);

export type Metadata = t.TypeOf<typeof Metadata>;

export const MetadataList = t.array(Metadata, 'Metadata[]');
export type MetadataList = t.TypeOf<typeof MetadataList>;

export {
  HomeMetadata,
  SearchMetadata,
  HashtagMetadata,
  VideoMetadata,
  ParsedInfo,
};
