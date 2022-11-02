import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const MetadataBase = t.strict(
  {
    id: t.string,
    supporter: t.string,
    savingTime: t.union([date, DateFromISOString]),
    clientTime: t.union([date, DateFromISOString]),
    href: t.string,
    blang: t.union([t.string, t.null]),
  },
  'MetadataBase'
);
export type MetadataBase = t.TypeOf<typeof MetadataBase>;
