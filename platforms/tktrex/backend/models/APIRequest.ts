import { APIRequestContributionEvent } from '@tktrex/shared/models/contribution/APIRequestContributionEvent';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

export const APIRequestEventDB = t.type(
  {
    ...APIRequestContributionEvent.type.props,
    _id: t.string,
    id: t.string,
    clientTime: date,
    savingTime: date,
    publicKey: t.string,
  },
  'APIRequestEventDB'
);
export type APIRequestEventDB = t.TypeOf<typeof APIRequestEventDB>;