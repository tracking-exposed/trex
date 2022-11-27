import * as t from 'io-ts';
import { SigiStateType } from '../sigiState/SigiState';
import { ContributionEventBase } from './ContributionEventBase';

export const SigiStateContributionEvent = t.strict(
  {
    ...ContributionEventBase.type.props,
    state: t.any,
    type: SigiStateType,
  },
  'SigiStateContributionEvent',
);
export type SigiStateContributionEvent = t.TypeOf<
  typeof SigiStateContributionEvent
>;
