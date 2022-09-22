import * as t from 'io-ts';

export const HomeN = t.strict(
  {
    type: t.literal('home'),
  },
  'HomeNature'
);

export const SearchN = t.strict(
  {
    type: t.literal('search'),
    query: t.string,
  },
  'SearchNature'
);

export const VideoN = t.strict(
  {
    type: t.literal('video'),
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

export const Nature = t.union([HomeN, SearchN, VideoN, ChannelN], 'Nature');
export type Nature = t.TypeOf<typeof Nature>;
