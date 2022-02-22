import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

// still a copy from YT to be converted

export const PersonalVideoFeed = t.strict(
  {
    id: t.string,
    savingTime: DateFromISOString,
  },
  'PersonalVideoFeed'
);

export type PersonalVideoFeed = t.TypeOf<typeof PersonalVideoFeed>;

export const PersonalVideoList = t.strict(
  {
    total: t.number,
    stripped: t.number,
    content: t.array(PersonalVideoFeed),
  },
  'PersonalVideoList'
);

export type PersonalVideoList = t.TypeOf<typeof PersonalVideoList>;
