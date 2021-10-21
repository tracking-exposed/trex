import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const ContentCreator = t.strict(
  {
    _id: t.string,
    channelId: t.string,
    username: t.string,
    avatar: t.string,
    accessToken: t.string,
    url: t.string,
    code: t.string,
    registeredOn: DateFromISOString,
  },
  'ContentCreator'
);

export type ContentCreator = t.TypeOf<typeof ContentCreator>;
