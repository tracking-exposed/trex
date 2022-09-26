import * as t from 'io-ts';
import { Leaf } from '../models/Leaf';
import { HTML } from '../models/HTML';
import { Supporter } from '../models/Supporter';

export const HTMLSource = t.type(
  {
    html: HTML,
    supporter: Supporter,
    jsdom: t.any,
  },
  'HTMLSource'
);
export type HTMLSource = t.TypeOf<typeof HTMLSource>;

export const LeafSource = t.type(
  {
    html: Leaf,
    supporter: Supporter,
  },
  'LeafSource'
);

export type LeafSource = t.TypeOf<typeof LeafSource>;
