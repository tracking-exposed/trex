import * as t from 'io-ts';

export const Leaf = t.strict({

}, 'LeafDB');

export type Leaf = t.TypeOf<typeof Leaf>