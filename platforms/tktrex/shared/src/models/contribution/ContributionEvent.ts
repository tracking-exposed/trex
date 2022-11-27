import * as t from 'io-ts';

export const HTMLContributionEvent = t.strict(
  {
    html: t.string,
    href: t.string,
    feedId: t.string,
    incremental: t.number,
    feedCounter: t.union([t.number, t.undefined]),
    videoCounter: t.union([t.number, t.undefined]),
    rect: t.any,
    clientTime: t.string,
    type: t.union([
      t.literal('search'),
      t.literal('video'),
      t.literal('profile'),
      t.literal('native'),
    ]),
    experimentId: t.union([t.string, t.undefined]),
  },
  'HTMLContributionEvent',
);
export type HTMLContributionEvent = t.TypeOf<typeof HTMLContributionEvent>;
