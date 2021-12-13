import * as t from "io-ts";

const ChannelType = t.literal("channel");
const HashtagType = t.literal("hashtag");
const SearchType = t.literal("search");
const VideoType = t.literal("video");
const HomeType = t.literal("home");
const UnknownType = t.literal("unknown");

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
    t.strict({
      type: UnknownType,
    }),
  ],
  "Nature"
);

type Nature = t.TypeOf<typeof Nature>;

export const NatureType = t.union(
  [ChannelType, HashtagType, SearchType, VideoType, HomeType, UnknownType],
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
