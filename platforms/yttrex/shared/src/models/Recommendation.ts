import * as t from 'io-ts';

export const Recommendation = t.strict({}, 'RecommendationDB');

export type Recommendation = t.TypeOf<typeof Recommendation>;
