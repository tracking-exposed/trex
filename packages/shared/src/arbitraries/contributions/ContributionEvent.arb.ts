import { getArbitrary } from 'fast-check-io-ts';
import {
  ADVContributionEvent,
  ContributionEvent,
  VideoContributionEvent,
} from '../../models/ContributionEvent';
import * as t from 'io-ts';
import fc from 'fast-check';

const { ...videoContributionEventProps } = VideoContributionEvent.type.props;
export const VideoContributionEventArb = getArbitrary(
  t.strict({
    ...videoContributionEventProps,
  })
).map((cc): any => ({
  ...cc,
  clientTime: new Date(),
}));

const { ...advContributionEventProps } = ADVContributionEvent.type.props;
export const ADVContributionEventArb = getArbitrary(
  t.strict({
    ...advContributionEventProps,
  })
).map((cc) => ({
  ...cc,
}));

export const ContributionEventArb: fc.Arbitrary<ContributionEvent> = fc.oneof(
  VideoContributionEventArb,
  ADVContributionEventArb
);
