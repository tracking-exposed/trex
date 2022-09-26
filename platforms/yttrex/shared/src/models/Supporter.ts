import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

export const Supporter = t.strict(
  {
    publicKey: t.string,
    version: t.string,
    creationTime: date,
    lastActivity: date,
    p: t.string,
  },
  'SupporterDB'
);

export type Supporter = t.TypeOf<typeof Supporter>;
