import * as t from 'io-ts';
import { ContributionEventBase } from './ContributionEventBase';

export const HTMLContributionEvent = t.strict(
  {
    ...ContributionEventBase.type.props,
    html: t.string,
    rect: t.any,
    type: t.union([
      t.literal('search'),
      t.literal('video'),
      t.literal('profile'),
      t.literal('native'),
    ]),
  },
  'HTMLContributionEvent',
);
export type HTMLContributionEvent = t.TypeOf<typeof HTMLContributionEvent>;
