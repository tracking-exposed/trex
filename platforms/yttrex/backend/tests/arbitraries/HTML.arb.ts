import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { HTML } from '../../models/HTML';


/**
 * HTML arbitrary
 *
 **/

const htmlProps = propsOmit(HTML, ['id', 'metadataId']);
export const HTMLArb = getArbitrary(
  t.strict({
    ...htmlProps,
    clientTime: t.unknown,
    savingTime: t.unknown,
  })
).map((ad) => ({
  ...ad,
  counters: fc.sample(fc.array(fc.nat({ min: 0, max: 10 })), 1)[0],
  id: fc.sample(fc.uuid(), 1)[0],
  metadataId: null,
  savingTime: fc.sample(fc.date(), 1)[0],
  clientTime: fc.sample(fc.date(), 1)[0],
}));
