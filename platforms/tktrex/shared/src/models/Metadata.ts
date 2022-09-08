import * as t from 'io-ts';
import { FollowingN, ForYouN, SearchN, NativeVideoN } from './Nature';

const Music = t.type(
  {
    url: t.string,
    name: t.string,
  },
  'Music',
);

type Music = t.TypeOf<typeof Music>;

const Author = t.type(
  {
    link: t.string,
    username: t.string,
  },
  'Author',
);

type Author = t.TypeOf<typeof Author>;

const AuthorWithName = t.intersection(
  [
    Author,
    t.type(
      {
        name: t.string,
      },
      'name',
    ),
  ],
  'AuthorWithName',
);

type AuthorWithName = t.TypeOf<typeof AuthorWithName>;

const Metrics = t.type(
  {
    liken: t.string,
    commentn: t.string,
    sharen: t.string,
  },
  'Metrics',
);

type Metrics = t.TypeOf<typeof Metrics>;

export const MetadataBase = t.type(
  {
    id: t.string,
    clientTime: t.string,
    savingTime: t.string,
    publicKey: t.string,
  },
  'MetadataBase',
);

export type MetadataBase = t.TypeOf<typeof MetadataBase>;

export const ForYouVideoMetadata = t.intersection(
  [
    MetadataBase,
    ForYouN,
    t.type({ nature: ForYouN }),
    t.type(
      {
        // baretext is the smallest part of the description,
        // not including the tags
        baretext: t.string,

        // description is the whole text written below the video,
        // including the tags
        description: t.string,

        author: AuthorWithName,
        music: Music,
        // the hashtags, with their leading #
        // note: they do not seem to be cleaned at the moment,
        // some have trailing whitespace
        hashtags: t.array(t.string),
        metrics: Metrics,
      },
      'foryou',
    ),
  ],
  'ForYouVideoMetadata',
);

export type ForYouVideoMetadata = t.TypeOf<typeof ForYouVideoMetadata>;

export const FollowingVideoMetadata = t.intersection(
  [
    MetadataBase,
    FollowingN,
    t.type({ nature: FollowingN }),
    t.type(
      {
        author: AuthorWithName,
        music: Music,
      },
      'following',
    ),
  ],
  'FollowingVideoMetaData',
);

export type FollowingVideoMetadata = t.TypeOf<typeof FollowingVideoMetadata>;

export const SearchMetadata = t.intersection(
  [
    MetadataBase,
    SearchN,
    t.type({ nature: SearchN }),
    t.type(
      {
        results: t.array(t.any),
        query: t.string,
        thumbnails: t.array(
          t.type({
            downloaded: t.boolean,
            filename: t.string,
            reason: t.number,
          }),
        ),
      },
      'search',
    ),
  ],
  'SearchVideoMetadata',
);

export type SearchMetadata = t.TypeOf<typeof SearchMetadata>;

export const NativeMetadata = t.intersection(
  [
    MetadataBase,
    NativeVideoN,
    t.type({ nature: NativeVideoN }, 'NativeMetadataType'),
    t.type(
      {
        description: t.string,
        music: t.union([Music, t.undefined, t.null]),
        author: t.union([Author, t.undefined, t.null]),
        metrics: t.union([Metrics, t.undefined, t.null]),
        hashtags: t.union([t.array(t.string), t.null]),
      },
      'NativeMetadataProps',
    ),
  ],
  'NativeMetadata',
);

export type NativeMetadata = t.TypeOf<typeof NativeMetadata>;

export const TKMetadata = t.union(
  [ForYouVideoMetadata, FollowingVideoMetadata, SearchMetadata, NativeMetadata],
  'TKMetadata',
);

export type TKMetadata = t.TypeOf<typeof TKMetadata>;
