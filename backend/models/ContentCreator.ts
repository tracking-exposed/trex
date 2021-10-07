import * as t from "io-ts";

export const ContentCreator = t.strict(
  {
    channelId: t.string,
    avatar: t.string,
  },
  "ContentCreator"
);

export type ContentCreator = t.TypeOf<typeof ContentCreator>;
