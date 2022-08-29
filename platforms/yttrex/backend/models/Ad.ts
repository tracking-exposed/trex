import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';
import { Nature } from './Nature';

export const Ad = t.strict(
  {
    id: t.string,
    href: t.string,
    metadataId: t.string,
    selectorName: t.string,
    sponsoredName: t.union([t.string, t.undefined, t.null]),
    sponsoredSite: t.union([t.string, t.undefined, t.null]),
    savingTime: date,
    offsetLeft: t.number,
    offsetTop: t.number,
    nature: Nature,
  },
  'AdDB'
);

export type Ad = t.TypeOf<typeof Ad>;
