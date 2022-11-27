import * as t from 'io-ts';
import { date } from 'io-ts-types/date';
import { DateFromISOString } from 'io-ts-types/DateFromISOString';

export const APIRequestContributionEvent = t.strict(
  {
    type: t.literal('api'),
    href: t.string,
    payload: t.unknown,
    clientTime: t.union([DateFromISOString, date]),
    incremental: t.number,
    feedId: t.string,
    feedCounter: t.number,
    videoCounter: t.number,
    experimentId: t.union([t.string, t.undefined]),
  },
  'APIRequestContributionEvent',
);
export type APIRequestContributionEvent = t.TypeOf<
  typeof APIRequestContributionEvent
>;
