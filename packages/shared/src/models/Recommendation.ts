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

export const CreateRecommendation = t.type(
  { url: t.string },
  'CreateRecommendation'
);
export type CreateRecommendation = t.TypeOf<typeof CreateRecommendation>;

export const Recommendation = t.strict(
  {
    urlId: t.string,
    url: t.string,
    title: t.string,
    description: t.union([t.string, t.undefined]),
    fromChannel: t.union([t.boolean, t.undefined]),
    image: t.union([t.string, t.null, t.undefined]),
  },
  'Recommendation'
);

export const PartialRecommendation = t.partial(
  { ...Recommendation.type.props },
  'PartialRecommendation'
);

export type PartialRecommendation = t.TypeOf<typeof PartialRecommendation>;

export const titleMaxLength = 80;
export const descriptionMaxLength = 200;

export type Recommendation = t.TypeOf<typeof Recommendation>;

export const RecommendationList = t.array(Recommendation, 'RecommendationList');
export type RecommendationList = t.TypeOf<typeof RecommendationList>;
