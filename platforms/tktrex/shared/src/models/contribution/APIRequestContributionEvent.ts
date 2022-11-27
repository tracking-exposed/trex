import * as t from 'io-ts';
import { ContributionEventBase } from './ContributionEventBase';

export const APIRequestContributionEvent = t.strict(
  {
    ...ContributionEventBase.type.props,
    type: t.literal('api'),
    payload: t.unknown,
  },
  'APIRequestContributionEvent',
);
export type APIRequestContributionEvent = t.TypeOf<
  typeof APIRequestContributionEvent
>;
