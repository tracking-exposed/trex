import { SigiStateContributionEvent } from '@tktrex/shared/models/contribution/SigiStateContributionEvent';
import * as t from 'io-ts';
import { date } from 'io-ts-types/lib/date';

export const SigiStateDB = t.type(
  {
    ...SigiStateContributionEvent.type.props,
    _id: t.string,
    id: t.string,
    clientTime: date,
    savingTime: date,
    publicKey: t.string,
  },
  'SigiStateDB'
);
export type SigiStateDB = t.TypeOf<typeof SigiStateDB>;
