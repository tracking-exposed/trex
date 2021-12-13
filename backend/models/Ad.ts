import * as t from "io-ts";

export const ChannelType = t.literal("channel");
export type ChannelType = t.TypeOf<typeof ChannelType>
export const HashtagType = t.literal("hashtag");
export const SearchType = t.literal("search");
export const VideoType = t.literal("video");
export const HomeType = t.literal("home");

const Nature = t.union(
  [
    t.strict({
      type: ChannelType,
      authorSource: t.string,
    }),
    t.strict({
      type: HashtagType,
      hashtag: t.string,
    }),
    t.strict({
      type: SearchType,
      query: t.unknown,
    }),
    t.strict({
      type: VideoType,
      videoId: t.string,
    }),
    t.strict({
      type: HomeType,
    }),
  ],
  "Nature"
);

type Nature = t.TypeOf<typeof Nature>;

export const NatureType = t.union(
  [ChannelType, HashtagType, SearchType, VideoType, HomeType],
  "NatureType"
);

export type NatureType = t.TypeOf<typeof NatureType>;

export const Ad = t.strict(
  {
    id: t.string,
    href: t.string,
    metadataId: t.string,
    selectorName: t.string,
    sponsoredName: t.string,
    sponsoredSite: t.string,
    authorName: t.string,
    authorSource: t.string,
    savingTime: t.string,
    offsetLeft: t.number,
    offsetTop: t.number,
    nature: Nature,
  },
  "AdDB"
);

export type Ad = t.TypeOf<typeof Ad>;
