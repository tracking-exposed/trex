import * as t from 'io-ts';

export const UpdateVideoBody = t.type(
  {
    videoId: t.string,
    recommendations: t.array(t.string),
  },
  'UpdateVideoBody'
);

export type UpdateVideoBody = t.TypeOf<typeof UpdateVideoBody>;

export const Video = t.strict(
  {
    description: t.union([t.string, t.undefined]),
    recommendations: t.array(t.string),
    title: t.string,
    videoId: t.string,
  },
  'Video'
);
export type Video = t.TypeOf<typeof Video>;
