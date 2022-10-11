import * as t from 'io-ts';

export const Metrics = t.type(
  {
    liken: t.union([t.string, t.null]),
    commentn: t.union([t.string, t.null]),
    sharen: t.union([t.string, t.null]),
  },
  'Metrics',
);

export type Metrics = t.TypeOf<typeof Metrics>;
