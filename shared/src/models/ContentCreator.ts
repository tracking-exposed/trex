import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";

export const ContentCreator = t.strict(
  {
    channelId: t.string,
    username: t.union([t.undefined, t.string]),
    avatar: t.union([t.undefined, t.string]),
    accessToken: t.union([t.undefined, t.string]),
    url: t.union([t.undefined, t.string]),
    registeredOn: t.union([t.undefined, DateFromISOString]),
    // count: t.union([t.number, t.undefined]),
  },
  "ContentCreator"
);

export type ContentCreator = t.TypeOf<typeof ContentCreator>;
