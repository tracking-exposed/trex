import { getArbitrary } from 'fast-check-io-ts';
import { ContentCreator } from '../models/ContentCreator';
import * as t from 'io-ts';
import fc from 'fast-check';

/**
 * Content Creator arbitrary
 *
 * with `fast-check-io-ts` we can derive a `fast-check` arbitrary
 * to randomly generate valid object for our models.
 *
 * There's no support for types from `io-ts-types`,
 * but the props can be overridden on arbitrary definition
 *
 * */

const { ...contentCreatorProps } = ContentCreator.type.props;
export const ContentCreatorArb = getArbitrary(
  t.strict({
    ...contentCreatorProps,
    registeredOn: t.string,
  })
).map((cc) => ({
  ...cc,
  url: fc.sample(fc.webUrl(), 1)[0],
  registeredOn: new Date(),
}));
