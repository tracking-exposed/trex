import * as t from 'io-ts';
import { APIRequestContributionEvent } from './APIRequestContributionEvent';

export const APIRequest = t.strict(
  {
    ...APIRequestContributionEvent.type.props,
    id: t.string,
    supporter: t.string,
  },
  'APIRequest',
);
export type APIRequest = t.TypeOf<typeof APIRequest>;
