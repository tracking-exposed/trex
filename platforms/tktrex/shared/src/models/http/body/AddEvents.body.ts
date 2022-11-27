import * as t from 'io-ts';
import { APIRequestContributionEvent } from '../../apiRequest';
import { HTMLContributionEvent } from '../../contribution/ContributionEvent';

export const AddEventsBody = t.array(
  t.union([APIRequestContributionEvent, HTMLContributionEvent]),
  'AddEventsBody',
);
export type AddEventsBody = t.TypeOf<typeof AddEventsBody>;
