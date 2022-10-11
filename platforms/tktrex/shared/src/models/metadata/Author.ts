import * as t from 'io-ts';

export const Author = t.type(
  {
    link: t.string,
    username: t.string,
    name: t.union([t.string, t.undefined]),
  },
  'Author',
);

export type Author = t.TypeOf<typeof Author>;
