import * as t from 'io-ts';

export const Recommendation = t.strict(
  {
    videoId: t.string,
    urlId: t.string,
    title: t.string,
    description: t.string,
    image: t.union([t.undefined, t.string]),
  },

  'Recommendation'
);

export type Recommendation = t.TypeOf<typeof Recommendation>;
