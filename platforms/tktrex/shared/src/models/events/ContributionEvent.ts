import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const ContributionEvent = t.strict(
  {
    html: t.string,
    href: t.string,
    feedId: t.string,
    feedCounter: t.number,
    videoCounter: t.number,
    rect: t.any,
    clientTime: DateFromISOString,
    type: t.literal('video'),
    incremental: t.number,
  },
  'ContributionEvent',
);

export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;
