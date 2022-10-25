import * as t from 'io-ts';

export const MediaFile = t.type(
  {
    reason: t.number,
    filename: t.union([t.string, t.undefined]),
    downloaded: t.boolean,
  },
  'MediaFile',
);

export type MediaFile = t.TypeOf<typeof MediaFile>;
