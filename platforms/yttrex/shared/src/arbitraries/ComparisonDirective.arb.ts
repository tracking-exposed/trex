import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import { HumanReadableStringArb } from '@shared/arbitraries/HumanReadableString.arb';
import { URLArb } from '@shared/arbitraries/URL.arb';
import {
  ComparisonDirective,
  ComparisonDirectiveRow,
} from '../models/Directive';

const WatchForArb = fc.oneof(
  fc.constant('end'),
  fc.integer({ min: 1, max: 30 }).map((n) => `${n}s`)
);

export const ComparisonDirectiveRowArb = getArbitrary(
  ComparisonDirectiveRow
).map(() => ({
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  urltag: fc.sample(HumanReadableStringArb(), 1)[0],
  watchFor: fc.sample(WatchForArb, 1)[0],
}));

export const ComparisonDirectiveArb = getArbitrary(ComparisonDirective).map(
  (r) => ({
    ...r,
    url: fc.sample(URLArb, 1)[0],
    watchFor: fc.sample(WatchForArb, 1)[0],
  })
);
