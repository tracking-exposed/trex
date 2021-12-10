import * as t from "io-ts";

export const Ad = t.strict(
  {
    id: t.string,
    href: t.string,
    title: t.string,
    metadataId: t.string,
    selectorName: t.string,
    sponsoredName: t.string,
    sponsoredSite: t.string,
    authorName: t.string,
    authorSource: t.string,
    videoId: t.string,
    savingTime: t.string,
  },
  "AdDB"
);

export type Ad = t.TypeOf<typeof Ad>;
