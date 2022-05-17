import * as t from 'io-ts';
import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import {
  SearchDirectiveRow,
  ComparisonDirectiveRow,
  SearchDirective,
  ComparisonDirective,
  PostDirectiveSuccessResponse,
} from '../models/Directive';
import { HumanReadableStringArb } from './HumanReadableString.arb';
import { URLArb } from './URL.arb';
import { GuardoniExperiment } from '../models/Experiment';
import { propsOmit } from '../utils/arbitrary.utils';

const WatchForArb = fc.oneof(
  fc.constant('end'),
  fc.integer({ min: 1, max: 30 }).map((n) => `${n}s`)
);

const LoadForArb = fc.integer({ min: 1000, max: 10000 });

export const SearchDirectiveRowArb = getArbitrary(SearchDirectiveRow).map(
  (r) => ({
    ...r,
    title: fc.sample(HumanReadableStringArb())[0],
    url: fc.sample(URLArb, 1)[0],
    videoURL: fc.sample(URLArb, 1)[0],
  })
);

export const SearchDirectiveArb = getArbitrary(SearchDirective).map((r) => ({
  ...r,
  url: fc.sample(URLArb, 1)[0],
  loadFor: fc.sample(LoadForArb, 1)[0],
  targetVideoId: fc.sample(fc.uuid())[0],
  watchFor: fc.sample(WatchForArb, 1)[0],
}));

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
  t.strict(propsOmit(GuardoniExperiment, ['when', 'links']))
).map((exp) => ({
  ...exp,
  when: new Date().toISOString(),
  links: [],
}));
