import { fc } from '@trex/shared/test';
import { getArbitrary } from 'fast-check-io-ts';
import { Ad } from '../../models/Ad';

/**
 * Ad arbitrary
 *
 **/

export const AdArb = getArbitrary(Ad).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  sponsoredSite: fc.sample(fc.webUrl(), 1)[0],
  savingTime: new Date(),
}));
