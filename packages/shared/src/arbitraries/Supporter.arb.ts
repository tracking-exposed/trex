import { getArbitrary } from 'fast-check-io-ts';
import { Supporter } from '../models/Supporter';
import * as t from 'io-ts';

const { creationTime, lastActivity, ...supporterProps } = Supporter.type.props;
export const SupporterArb = getArbitrary(
  t.strict({
    ...supporterProps,
  })
).map((cc) => ({
  ...cc,
  creationTime: new Date(),
  lastActivity: new Date(),
}));
