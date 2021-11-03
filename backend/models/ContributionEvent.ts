import * as t from "io-ts";

export const ContributionEvent = t.strict(
  {
    element: t.any,
    href: t.string,
    selector: t.string,
    size: t.number,
    incremental: t.number,
    clientTime: t.number,
    randomUUID: t.string,
    profileStory: t.number,
  },
  "ContributionEvent"
);

export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;
