import * as t from 'io-ts';
import { NativeVideoN, Nature, SearchN } from '../Nature';
import { MetadataBase } from './MetadataBase';

export const ResultLinked = t.type(
  { link: Nature, desc: t.string },
  'ResultLinked'
);
export type ResultLinked = t.TypeOf<typeof ResultLinked>;

export const SearchMetadataResult = t.type(
  {
    order: t.number,
    video: NativeVideoN,
    textdesc: t.string,
    linked: t.array(ResultLinked),
    thumbnail: t.string,
    publishingDate: t.union([t.string, t.null]),
  },
  'SearchMetadataResult'
);
export const SearchMetadata = t.intersection(
  [
    MetadataBase,
    SearchN,
    t.type({ nature: SearchN }),
    t.type(
      {
        results: t.array(SearchMetadataResult),
        thumbnails: t.array(
          t.type({
            downloaded: t.boolean,
            filename: t.union([t.string, t.null]),
            reason: t.number,
          })
        ),
      },
      'search'
    ),
  ],
  'SearchVideoMetadata'
);

export type SearchMetadata = t.TypeOf<typeof SearchMetadata>;
