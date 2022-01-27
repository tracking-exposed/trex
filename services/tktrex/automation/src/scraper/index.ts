import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';

export const Snapshot = t.type(
  {
    _id: t.union([t.string, t.undefined]),
    type: t.literal('Snapshot'),
    url: t.string,
    experimentType: t.string,
    html: t.string,
    scrapedOn: DateFromISOString,
    metaData: t.union([t.undefined, t.unknown]),
  },
  'Snapshot',
);
export type Snapshot = t.TypeOf<typeof Snapshot>;
