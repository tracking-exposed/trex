import * as t from 'io-ts';

export const SigiStateContributionEvent = t.strict(
  {
    state: t.any,
    href: t.string,
    feedId: t.string,
    incremental: t.number,
    feedCounter: t.union([t.number, t.undefined]),
    videoCounter: t.union([t.number, t.undefined]),
    clientTime: t.string,
    type: t.literal('sigiState'),
    experimentId: t.union([t.string, t.undefined]),
  },
  'SigiStateContributionEvent',
);
export type SigiStateContributionEvent = t.TypeOf<
  typeof SigiStateContributionEvent
>;
