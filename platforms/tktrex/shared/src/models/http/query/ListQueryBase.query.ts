import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';

export const ListQueryBase = t.type(
  {
    amount: t.union([NumberFromString, t.number, t.undefined]),
    skip: t.union([NumberFromString, t.number, t.undefined]),
  },
  'ListQueryBase',
);

export type ListQueryBase = t.TypeOf<typeof ListQueryBase>;
