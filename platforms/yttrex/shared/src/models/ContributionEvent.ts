import {
  ADVContributionEvent,
  VideoContributionEvent,
} from '@shared/models/ContributionEvent';
import * as t from 'io-ts';

export const ContributionEvent = t.union(
  [VideoContributionEvent, ADVContributionEvent],
  ' ContributionEvent'
);
export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;
