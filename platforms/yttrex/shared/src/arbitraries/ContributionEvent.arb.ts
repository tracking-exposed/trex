import { getArbitrary } from 'fast-check-io-ts';
import { ContributionEvent } from '../models/ContributionEvent';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import * as t from 'io-ts';

export const ContributionEventArb = getArbitrary(
  t.strict(propsOmit(ContributionEvent.types[0], ['clientTime']))
).map((e) => ({
  ...e,
  clientTime: new Date().toISOString(),
}));
