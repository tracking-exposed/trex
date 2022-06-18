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

export const MetaDataBase = t.type(
  {
    id: t.string,
    savingTime: t.string,
    publicKey: t.string,
  },
  'VideoMetaDataBase',
);

export type MetaDataBase = t.TypeOf<typeof MetaDataBase>;

export const ForYouVideoMetaData = t.intersection(
  [
    MetaDataBase,
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
  'ForYouVideoMetaData',
);

export type ForYouVideoMetaData = t.TypeOf<typeof ForYouVideoMetaData>;

export const FollowingVideoMetaData = t.intersection(
  [
    MetaDataBase,
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

export type FollowingVideoMetaData = t.TypeOf<typeof FollowingVideoMetaData>;

export const SearchMetaData = t.intersection(
  [
    MetaDataBase,
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
  'SearchVideoMetaData',
);

export type SearchMetaData = t.TypeOf<typeof SearchMetaData>;

export const MetaData = t.union(
  [ForYouVideoMetaData, FollowingVideoMetaData, SearchMetaData],
  'VideoMetaData',
);

export type MetaData = t.TypeOf<typeof MetaData>;

export default MetaData;
