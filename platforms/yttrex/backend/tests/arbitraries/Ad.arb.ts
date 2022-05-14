import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import { Ad } from '../../models/Ad';
import * as t from 'io-ts';

/**
 * Ad arbitrary
 *
 **/
const adProps = propsOmit(Ad, ['savingTime']);

export const AdArb = getArbitrary(
  t.strict({ ...adProps, savingTime: t.unknown })
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  sponsoredSite: fc.sample(fc.webUrl(), 1)[0],
  savingTime: new Date(),
}));
