import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { APIRequestContributionEvent } from '../models/contribution/APIRequestContributionEvent';
import { HTMLContributionEvent } from '../models/contribution/HTMLContributionEvent';
import { SigiStateContributionEvent } from '../models/contribution/SigiStateContributionEvent';

export const SigiStateContributionEventArb: fc.Arbitrary<SigiStateContributionEvent> =
  getArbitrary(
    t.type({
      ...propsOmit(SigiStateContributionEvent, ['clientTime', 'state']),
    }),
  ).map((e) => ({
    ...e,
    videoCounter: fc.sample(fc.nat(), 1)[0],
    feedCounter: fc.sample(fc.nat(), 1)[0],
    incremental: fc.sample(fc.nat(), 1)[0],
    clientTime: new Date().toISOString(),
    state: JSON.stringify(fc.sample(fc.jsonValue(), 1)[0]),
  }));

export const APIRequestEventArb: fc.Arbitrary<APIRequestContributionEvent> =
  getArbitrary(
    t.type({ ...propsOmit(APIRequestContributionEvent, ['clientTime']) }),
  ).map((e) => ({
    ...e,
    clientTime: new Date().toISOString(),
    videoCounter: fc.sample(fc.nat(), 1)[0],
    feedCounter: fc.sample(fc.nat(), 1)[0],
    incremental: fc.sample(fc.nat(), 1)[0],
    payload: JSON.stringify(fc.sample(fc.jsonValue(), 1)[0]),
  }));

export const ContributionEventArb: fc.Arbitrary<HTMLContributionEvent> =
  getArbitrary(
    t.strict(propsOmit(HTMLContributionEvent, ['clientTime', 'rect'])),
  ).map((e) => ({
    ...e,
    clientTime: new Date().toISOString(),
    videoCounter: fc.sample(fc.nat(), 1)[0],
    feedCounter: fc.sample(fc.nat(), 1)[0],
    incremental: fc.sample(fc.nat(), 1)[0],
    rect: {
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
    },
  }));
