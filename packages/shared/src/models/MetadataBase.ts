import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const MetadataBase = t.type(
  {
    id: t.string,
    /**
     * The href where the evidence has been collected
     */
    href: t.string,
    /**
     * The supporter publicKey
     *
     * TODO: it may be replaced by the supporter id
     */
    blang: t.union([t.string, t.null, t.undefined]),
    supporter: t.string,
    researchTag: t.union([t.string, t.undefined]),
    experimentId: t.union([t.string, t.undefined]),
    /**
     * DB saving time
     */
    clientTime: t.union([date, DateFromISOString]),
    savingTime: t.union([date, DateFromISOString]),
  },
  'MetadataBase'
);

export type MetadataBase = t.TypeOf<typeof MetadataBase>;
