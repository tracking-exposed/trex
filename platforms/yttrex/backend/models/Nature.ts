import * as t from 'io-ts';

export const ChannelType = t.literal('channel');
export type ChannelType = t.TypeOf<typeof ChannelType>;
export const HashtagType = t.literal('hashtag');
export const SearchType = t.literal('search');
export const VideoType = t.literal('video');
export const HomeType = t.literal('home');

export const HomeN = t.strict(
  {
    type: HomeType,
  },
  'HomeNature'
);

export const SearchN = t.strict(
  {
    type: SearchType,
    query: t.string,
  },
  'SearchNature'
);

export const VideoN = t.strict(
  {
    type: VideoType,
    videoId: t.string,
  },
  'VideoNature'
);

export const ChannelN = t.strict(
  {
    type: t.literal('channel'),
    authorSource: t.string,
  },
  'ChannelN'
);

export const Nature = t.union([SearchN, VideoN, ChannelN, HomeN], 'Nature');
export type Nature = t.TypeOf<typeof Nature>;
