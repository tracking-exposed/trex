import * as t from 'io-ts';
import { date } from 'io-ts-types';
import { Nature } from './Nature';

export const Leaf = t.strict(
  {
    _id: t.string,
    id: t.string,
    metadataId: t.string,
    blang: t.string,
    publicKey: t.string,
    html: t.string,
    offsetTop: t.number,
    offsetLeft: t.number,
    href: t.string,
    selectorName: t.string,
    nature: Nature,
    savingTime: date,
    experiment: t.union([t.string, t.undefined]),
  },
  'LeafDB'
);

export type Leaf = t.TypeOf<typeof Leaf>;
