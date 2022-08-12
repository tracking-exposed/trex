import * as t from 'io-ts';

// still a copy from YT to be converted
export const What = t.union(
  [t.literal('foryou'), t.literal('following'), t.literal('search')],
  'What'
);
export type What = t.TypeOf<typeof What>;
