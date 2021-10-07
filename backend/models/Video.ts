import * as t from 'io-ts';

export const Video = t.strict(
  {
    videoId: t.string,
    title: t.string,
    recommendations: t.array(t.string),
  },
  'Video'
);
export type Video = t.TypeOf<typeof Video>;
