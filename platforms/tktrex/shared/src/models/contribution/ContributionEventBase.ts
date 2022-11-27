import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/DateFromISOString';
import { date } from 'io-ts-types/date';

export const ContributionEventBase = t.strict(
  {
    href: t.string,
    incremental: t.number,
    feedId: t.string,
    feedCounter: t.union([t.number, t.undefined]),
    videoCounter: t.union([t.number, t.undefined]),
    clientTime: t.union([DateFromISOString, date]),
    experimentId: t.union([t.string, t.undefined]),
  },
  'ContributionEventBase',
);
export type ContributionEventBase = t.TypeOf<typeof ContributionEventBase>;
