import * as t from "io-ts";

const Nature = t.union(
  [
    t.strict({
      type: t.literal("leaf"),
      query: t.unknown,
    }),
    t.strict({
      type: t.literal("channel"),
      authorSource: t.string,
    }),
    t.strict({
      type: t.literal("hashtag"),
      hashtag: t.string,
    }),
    t.strict({
      type: t.literal("search"),
      query: t.unknown,
    }),
    t.strict({
      type: t.literal("video"),
      videoId: t.string,
    }),
    t.strict({
      type: t.literal("home"),
    }),
    t.strict({
      type: t.literal("unknown"),
    }),
  ],
  "Nature"
);

type Nature = t.TypeOf<typeof Nature>;

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
