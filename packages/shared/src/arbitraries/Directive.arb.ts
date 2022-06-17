import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import {
  OpenURLDirective,
  PostDirectiveSuccessResponse,
} from '../models/Directive';
import { GuardoniExperiment } from '../models/Experiment';
import { propsOmit } from '../utils/arbitrary.utils';
import { HumanReadableStringArb } from './HumanReadableString.arb';
import { URLArb } from './URL.arb';

const WatchForArb = fc.oneof(
  fc.constant('end'),
  fc.integer({ min: 1, max: 30 }).map((n) => `${n}s`)
);

/**
 * Common directive
 */
export const CommonDirectiveArb = getArbitrary(OpenURLDirective).map(() => ({
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  urltag: fc.sample(HumanReadableStringArb(), 1)[0],
  watchFor: fc.sample(WatchForArb, 1)[0],
}));

const { status, since, ...CreateDirectiveResponseProps } =
  PostDirectiveSuccessResponse.type.props;
export const PostDirectiveSuccessResponseArb = getArbitrary(
  t.strict({ ...CreateDirectiveResponseProps })
).map((r) => ({
  ...r,
  status: fc.sample(
    fc.oneof(fc.constant('created'), fc.constant('exist')),
    1
  )[0],
  experimentId: fc.sample(fc.uuid(), 1)[0],
  since: new Date().toISOString(),
}));

export const GuardoniExperimentArb = getArbitrary(
  t.strict(propsOmit(GuardoniExperiment, ['when', 'directives']))
).map((exp) => ({
  ...exp,
  experimentId: fc.sample(fc.uuid(), 1)[0],
  when: new Date().toISOString(),
  directives: [],
}));
