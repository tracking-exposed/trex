import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';

export const GetRecommendationsQuery = t.type(
  // to make it "optional" change the codec to `t.union([NumberFromString, t.undefined])`
  { limit: NumberFromString },
  'GetRecommendationQuery'
);
export type GetRecommendationsQuery = t.TypeOf<typeof GetRecommendationsQuery>;

export const GetRecommendationsParams = t.type(
  { ids: t.string },
  'GetRecommendationParams'
);
export type GetRecommendationParams = t.TypeOf<typeof GetRecommendationsParams>;

export const Recommendation = t.strict(
  {
    videoId: t.union([t.string, t.undefined]),
    urlId: t.string,
    title: t.string,
    description: t.string,
    image: t.union([t.string, t.undefined]),
  },

  'Recommendation'
);

export type Recommendation = t.TypeOf<typeof Recommendation>;
