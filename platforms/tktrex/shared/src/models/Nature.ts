import * as t from 'io-ts';

export const ForYouType = t.literal('foryou');
export const FollowingType = t.literal('following');
export const CreatorType = t.literal('creator');
export const VideoType = t.literal('video');
export const SearchType = t.literal('search');
export const NativeType = t.literal('native');
export const ProfileType = t.literal('profile');
export const HashtagType = t.literal('tag');

export const NatureType = t.union(
  [
    ForYouType,
    FollowingType,
    CreatorType,
    VideoType,
    SearchType,
    NativeType,
    ProfileType,
    HashtagType,
  ],
  'NatureType',
);
export type NatureType = t.TypeOf<typeof NatureType>;

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

export const VideoN = t.type(
  {
    type: VideoType,
    videoId: t.string,
    authorId: t.string,
  },
  'VideoN',
);

export type VideoN = t.TypeOf<typeof VideoN>;

export const SearchN = t.strict(
  {
    type: SearchType,
    query: t.union([t.string, t.null]),
  },
  'SearchNature',
);
export type SearchN = t.TypeOf<typeof SearchN>;

export const NativeVideoN = t.strict(
  {
    type: NativeType,
    videoId: t.string,
    authorId: t.string,
  },
  'VideoNature',
);
export type NativeVideoN = t.TypeOf<typeof NativeVideoN>;

export const ProfileN = t.type(
  {
    type: t.union([CreatorType, ProfileType]),
    creatorName: t.string,
  },
  'ProfileN',
);

export type ProfileN = t.TypeOf<typeof ProfileN>;

export const HashtagsN = t.type(
  {
    type: HashtagType,
    hashtag: t.string,
  },
  'HashtagN',
);
export type HashtagsN = t.TypeOf<typeof HashtagsN>;

export const Nature = t.union(
  [ForYouN, FollowingN, VideoN, SearchN, ProfileN, HashtagsN, NativeVideoN],
  'Nature',
);

export type Nature = t.TypeOf<typeof Nature>;
