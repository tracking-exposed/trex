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
    urlId: t.string,
    url: t.string,
    title: t.string,
    description: t.union([t.string, t.undefined ]),
    image: t.string,
  },
  'Recommendation'
);

export const PartialRecommendation = t.partial(
  {...Recommendation.type.props},
  'PartialRecommendation'
);

export type PartialRecommendation = t.TypeOf<typeof PartialRecommendation>;

export const titleMaxLength = 50;
export const descriptionMaxLength = 100;

export type Recommendation = t.TypeOf<typeof Recommendation>;
