import * as t from 'io-ts';

export const ContributionEventBase = t.strict(
  {
    href: t.string,
    incremental: t.number,
    feedId: t.string,
    feedCounter: t.union([t.number, t.undefined]),
    videoCounter: t.union([t.number, t.undefined]),
    clientTime: t.string,
    experimentId: t.union([t.string, t.undefined]),
  },
  'ContributionEventBase',
);
export type ContributionEventBase = t.TypeOf<typeof ContributionEventBase>;
