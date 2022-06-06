import * as t from 'io-ts';

export const MinimalProjectConfig = t.type(
  {
    experimentType: t.string,
    useStealth: t.boolean,
    proxy: t.union([t.null, t.string]),
  },
  'MinimalProjectConfig'
);
export type MinimalProjectConfig = t.TypeOf<typeof MinimalProjectConfig>;
