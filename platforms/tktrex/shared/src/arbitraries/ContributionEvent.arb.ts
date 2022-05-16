import { getArbitrary } from 'fast-check-io-ts';
import { ContributionEvent } from '../models/events/ContributionEvent';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import * as t from 'io-ts';

export const ContributionEventArb = getArbitrary(
  t.strict(propsOmit(ContributionEvent, ['clientTime', 'rect'])),
).map((e) => ({
  ...e,
  clientTime: new Date().toISOString(),
  rect: {
    x: 0,
    y: 0,
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
  },
}));
