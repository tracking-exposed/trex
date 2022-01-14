import * as t from 'io-ts';
import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import {
  ChiaroScuroDirectiveRow,
  ComparisonDirectiveRow,
  ChiaroScuroDirective,
  ComparisonDirective,
  PostDirectiveSuccessResponse,
} from '../models/Directive';
import { HumanReadableStringArb } from './HumanReadableString.arb';
import { URLArb } from './URL.arb';

export const ChiaroScuroDirectiveRowArb = getArbitrary(
  ChiaroScuroDirectiveRow
).map((r) => ({
  ...r,
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  videoURL: fc.sample(URLArb, 1)[0],
}));

export const ComparisonDirectiveRowArb = getArbitrary(
  ComparisonDirectiveRow
).map(() => ({
  title: fc.sample(HumanReadableStringArb())[0],
  url: fc.sample(URLArb, 1)[0],
  urltag: fc.sample(HumanReadableStringArb(), 1)[0],
}));

export const ChiaroScuroDirectiveArb = getArbitrary(ChiaroScuroDirective).map(
  (r) => ({
    ...r,
    url: fc.sample(URLArb, 1)[0],
    loadFor: fc.sample(fc.nat(), 1)[0],
    targetVideoId: fc.sample(fc.uuid())[0],
  })
);

export const ComparisonDirectiveArb = getArbitrary(ComparisonDirective).map(
  (r) => ({
    ...r,
    url: fc.sample(URLArb, 1)[0],
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
