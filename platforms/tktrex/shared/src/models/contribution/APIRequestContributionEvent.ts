import * as t from 'io-ts';
import { ContributionEventBase } from './ContributionEventBase';

export const APIRequestType = t.literal('api');
export type APIRequestType = t.TypeOf<typeof APIRequestType>;

export const APIRequestContributionEvent = t.strict(
  {
    ...ContributionEventBase.type.props,
    type: APIRequestType,
    payload: t.string,
  },
  'APIRequestContributionEvent',
);
export type APIRequestContributionEvent = t.TypeOf<
  typeof APIRequestContributionEvent
>;
