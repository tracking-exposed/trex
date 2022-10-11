import * as t from 'io-ts';

export const Music = t.type(
  {
    url: t.string,
    name: t.string,
  },
  'Music',
);

export type Music = t.TypeOf<typeof Music>;
