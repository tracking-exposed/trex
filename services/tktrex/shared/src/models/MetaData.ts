import * as t from 'io-ts';

const Music = t.type({
  url: t.string,
  name: t.string,
}, 'Music');

type Music = t.TypeOf<typeof Music>;

const Author = t.type({
  link: t.string,
  username: t.string,
}, 'Author');

type Author = t.TypeOf<typeof Author>;

const AuthorWithName = t.intersection([
  Author,
  t.type({
    name: t.string,
  }, 'name'),
], 'AuthorWithName');

type AuthorWithName = t.TypeOf<typeof AuthorWithName>;

const Metrics = t.type({
  liken: t.string,
  commentn: t.string,
  sharen: t.string,
}, 'Metrics');

type Metrics = t.TypeOf<typeof Metrics>;

export const VideoMetaDataBase = t.type({
  type: t.union([
    t.literal('foryou'),
    t.literal('search'),
    t.literal('following'),
  ]),

  // baretext is the smallest part of the description,
  // not including the tags
  baretext: t.string,

  // description is the whole text written below the video,
  // including the tags
  description: t.string,

  // the hashtags, with their leading #
  // note: they do not seem to be cleaned at the moment,
  // some have trailing whitespace
  hashtags: t.array(t.string),

  metrics: Metrics,
});

export type VideoMetaDataBase = t.TypeOf<typeof VideoMetaDataBase>;

export const ForYouVideoMetaData = t.intersection([
  VideoMetaDataBase,
  t.type({
    type: t.literal('foryou'),
    author: AuthorWithName,
    music: Music,
  }),
], 'ForYouVideoMetaData');

export type ForYouVideoMetaData = t.TypeOf<typeof ForYouVideoMetaData>;

export const FollowingVideoMetaData = t.intersection([
  VideoMetaDataBase,
  t.type({
    type: t.literal('following'),
    author: AuthorWithName,
    music: Music,
  }),
], 'FollowingVideoMetaData');

export type FollowingVideoMetaData = t.TypeOf<typeof FollowingVideoMetaData>;

export const SearchVideoMetaData = t.intersection([
  VideoMetaDataBase,
  t.type({
    type: t.literal('following'),
    author: Author,
    music: Music,
  }),
], 'SearchVideoMetaData');

export type SearchVideoMetaData = t.TypeOf<typeof SearchVideoMetaData>;

export const VideoMetaData = t.union([
  ForYouVideoMetaData,
  FollowingVideoMetaData,
  SearchVideoMetaData,
], 'VideoMetaData');

export type VideoMetaData = t.TypeOf<typeof VideoMetaData>;

export const MetaData = VideoMetaData;

export type MetaData = t.TypeOf<typeof MetaData>;

export default MetaData;
