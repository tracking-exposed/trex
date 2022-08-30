import * as t from 'io-ts';

export const ForYouType = t.literal('foryou');
export const FollowingType = t.literal('following');
export const CreatorType = t.literal('creator');
export const VideoType = t.literal('video');
export const SearchType = t.literal('search');
export const NativeType = t.literal('native');

export const ForYouN = t.strict(
  {
    type: ForYouType,
  },
  'ForYouN',
);
export type ForYouN = t.TypeOf<typeof ForYouN>;

export const FollowingN = t.type(
  {
    type: FollowingType,
  },
  'FollowingN',
);

export type FollowingN = t.TypeOf<typeof FollowingN>;

export const CreatorN = t.type(
  {
    type: CreatorType,
  },
  'CreatorN',
);
export type CreatorN = t.TypeOf<typeof CreatorN>;

export const VideoN = t.type(
  {
    type: VideoType,
  },
  'VideoN',
);

export type VideoN = t.TypeOf<typeof VideoN>;

export const SearchN = t.strict(
  {
    type: SearchType,
  },
  'SearchNature',
);
export type SearchN = t.TypeOf<typeof SearchN>;

export const NativeVideoN = t.strict(
  {
    type: NativeType,
  },
  'VideoNature',
);
export type NativeVideoN = t.TypeOf<typeof NativeVideoN>;

export const Nature = t.union(
  [
    ForYouN,
    FollowingN,
    CreatorN,
    VideoN,
    SearchN,
    t.type({
      type: t.literal('tag'),
      hashtag: t.string,
    }),
    NativeVideoN,
  ],
  'Nature',
);

export type Nature = t.TypeOf<typeof Nature>;

export default Nature;
