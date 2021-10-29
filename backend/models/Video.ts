import * as t from 'io-ts';
import { Recommendation } from './Recommendation';

export const Video = t.strict(
  {
    ...Recommendation.type.props,
    videoId: t.string,
    recommendations: t.array(t.string),
  },
  'Video'
);
export type Video = t.TypeOf<typeof Video>;
