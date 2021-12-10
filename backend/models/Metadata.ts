import { VideoContributionEvent } from "@shared/models/ContributionEvent";
import * as t from "io-ts";
import { date } from "io-ts-types/lib/date";

const Nature = t.union(
  [
    t.strict({
      type: t.literal("leaf"),
      query: t.unknown,
    }),
    t.strict({
      type: t.literal("channel"),
      authorSource: t.string
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

const { element, size } = VideoContributionEvent.type.props;
export const Metadata = t.strict(
  {
    ...{ element, size },
    id: t.string,
    metadataId: t.string,
    href: t.string,
    authorName: t.string,
    authorSource: t.string,
    title: t.string,
    savingTime: date,
    blang: t.string,
    publicKey: t.string,
    nature: Nature,
  },
  "MetadataDB"
);

export type Metadata = t.TypeOf<typeof Metadata>;
