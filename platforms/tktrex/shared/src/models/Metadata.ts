import * as t from 'io-ts';

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
    savingTime: t.string,
    publicKey: t.string,
  },
  'VideoMetaDataBase',
);

export type MetadataBase = t.TypeOf<typeof MetadataBase>;

export const ForYouVideoMetadata = t.intersection(
  [
    MetadataBase,
    t.type(
      {
        type: t.literal('foryou'),

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
    t.type(
      {
        type: t.literal('following'),
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
    t.type(
      {
        type: t.literal('search'),
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

export const Metadata = t.union(
  [ForYouVideoMetadata, FollowingVideoMetadata, SearchMetadata],
  'VideoMetaData',
);

export type Metadata = t.TypeOf<typeof Metadata>;

export default Metadata;
