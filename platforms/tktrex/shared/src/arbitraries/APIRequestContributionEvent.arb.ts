import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { APIRequestContributionEvent } from '../models/apiRequest/APIRequestContributionEvent';

export const APIRequestEventArb: fc.Arbitrary<APIRequestContributionEvent> =
  getArbitrary(
    t.type({ ...propsOmit(APIRequestContributionEvent, ['clientTime']) }),
  ).map((e) => ({
    ...e,
    clientTime: new Date(),
    payload: fc.sample(fc.jsonValue(), 1)[0],
  }));
