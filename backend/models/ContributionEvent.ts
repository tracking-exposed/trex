import * as t from "io-ts";

export const VideoContributionEvent = t.strict(
  {
    type: t.string,
    element: t.string,
    size: t.number,
    href: t.string,
    randomUUID: t.string,
    incremental: t.number,
    clientTime: t.string,
  },
  "VideoContributionEvent"
);

export type VideoContributionEvent = t.TypeOf<typeof VideoContributionEvent>;

export const ADVContributionEvent = t.strict(
  {
    type: t.literal("leaf"),
    html: t.string,
    hash: t.number,
    offsetTop: t.number,
    offsetLeft: t.number,
    href: t.string,
    selectorName: t.string,
    randomUUID: t.string,
    incremental: t.number,
    clientTime: t.string,
  },
  "ADVContributionEvent"
);

export type ADVContributionEvent = t.TypeOf<typeof ADVContributionEvent>;
