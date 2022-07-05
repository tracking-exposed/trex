import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import {
  OpenURLStep
} from '../models/Step';
import { HumanReadableStringArb } from './HumanReadableString.arb';
import { URLArb } from './URL.arb';

const WatchForArb = fc.oneof(
  fc.constant('end'),
  fc.integer({ min: 1, max: 30 }).map((n) => `${n}s`)
);

/**
 * Common directive
 */
export const CommonStepArb = getArbitrary(OpenURLStep).map(() => ({
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  urltag: fc.sample(HumanReadableStringArb(), 1)[0],
  watchFor: fc.sample(WatchForArb, 1)[0],
}));
