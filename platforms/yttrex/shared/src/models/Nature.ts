import * as t from 'io-ts';

export const HomeNatureType = t.literal('home');
export type HomeNatureType = t.TypeOf<typeof HomeNatureType>;

export const HomeN = t.strict(
  {
    type: HomeNatureType,
  },
  'HomeNature'
);
export type HomeN = t.TypeOf<typeof HomeNatureType>;

export const SearchNatureType = t.literal('search');
export type SearchNatureType = t.TypeOf<typeof SearchNatureType>;

export const SearchN = t.strict(
  {
    type: SearchNatureType,
    query: t.string,
  },
  'SearchNature'
);

export const VideoNatureType = t.literal('video');
export const VideoN = t.strict(
  {
    type: VideoNatureType,
    videoId: t.string,
  },
  'VideoNature'
);

export const ChannelNatureType = t.literal('channel');

export const ChannelN = t.strict(
  {
    type: ChannelNatureType,
    authorSource: t.string,
  },
  'ChannelN'
);

export const HashtagNatureType = t.literal('hashtag');
export type HashtagNatureType = t.TypeOf<typeof HashtagNatureType>;
export const HashtagN = t.strict(
  {
    type: HashtagNatureType,
    hashtag: t.string,
  },
  'HashtagNature'
);

export const NatureType = t.union(
  [
    HomeNatureType,
    SearchNatureType,
    VideoNatureType,
    ChannelNatureType,
    HashtagNatureType,
  ],
  'NatureType'
);
export type NatureType = t.TypeOf<typeof NatureType>;

export const Nature = t.union(
  [HomeN, SearchN, VideoN, ChannelN, HashtagN],
  'Nature'
);
export type Nature = t.TypeOf<typeof Nature>;
