import * as t from 'io-ts';

export const Video = t.strict(
  {
    description: t.union([t.string, t.undefined ]),
    recommendations: t.array(t.string),
    title: t.string,
    urlId: t.string,
    videoId: t.string,
  },
  'Video'
);
export type Video = t.TypeOf<typeof Video>;
