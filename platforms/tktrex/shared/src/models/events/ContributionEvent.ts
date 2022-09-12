import * as t from 'io-ts';

export const ContributionEvent = t.strict(
  {
    html: t.string,
    href: t.string,
    feedId: t.union([t.string, t.undefined]),
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
  },
  'ContributionEvent',
);

export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;
