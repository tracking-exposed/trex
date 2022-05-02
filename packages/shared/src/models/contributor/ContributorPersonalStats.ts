import * as t from 'io-ts';
import { StringOrNull } from '../common/StringOrNull';

export const HomeMetadata = t.strict(
  {
    id: t.string,
    savingTime: t.string,
    selected: t.array(StringOrNull, 'Selected'),
  },
  'HomeMetadata'
);
export type HomeMetadata = t.TypeOf<typeof HomeMetadata>;

export const VideoMetadata = t.strict(
  {
    id: t.string,
    videoId: t.string,
    savingTime: t.string,
    title: t.string,
    authorName: t.string,
    authorSource: t.string,
    publicationTime: t.string,
    relatedN: t.number,
    relative: t.string,
  },
  'VideoMetadata'
);
export type VideoMetadata = t.TypeOf<typeof VideoMetadata>;

export const SearchMetadata = t.strict(
  {
    id: t.string,
    savingTime: t.string,
    query: t.string,
    results: t.number,
  },
  'SearchMetadata'
);
export type SearchMetadata = t.TypeOf<typeof SearchMetadata>;

export const ContributorPersonalStats = t.strict(
  {
    supporter: t.strict({
      _id: t.string,
      publicKey: t.string,
      creationTime: t.string,
      p: t.string,
      lastActivity: t.string,
      version: t.string,
      tag: t.strict({
        id: t.string,
        name: t.string,
        accessibility: t.string,
        lastAccess: t.string,
        description: t.string,
        // _id: t.string
      }),
      hereSince: t.string,
    }),
    videos: t.array(VideoMetadata),
    homes: t.array(HomeMetadata),
    searches: t.array(SearchMetadata),
    ads: t.array(t.any),
    stats: t.strict({
      home: t.number,
      video: t.number,
      search: t.number,
    }),
    request: t.strict({
      amount: t.number,
      skip: t.number,
      when: t.string,
    }),
  },
  'ContributorPersonalStats'
);

export type ContributorPersonalStats = t.TypeOf<
  typeof ContributorPersonalStats
>;
