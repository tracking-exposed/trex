import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';

export const CreatorStatContent = t.strict(
  {
    id: t.string,
    watchedTitle: t.string,
    watchedVideoId: t.string,
    savingTime: DateFromISOString,
    recommendedVideoId: t.string,
    recommendedViews: t.number,
    recommendedTitle: t.string,
    recommendedChannel: t.string,
  },
  'CreatorStatContent'
);

export type CreatorStatContent = t.TypeOf<typeof CreatorStatContent>;

export const CreatorStats = t.strict(
  {
    authorName: t.string,
    authorSource: t.string,
    overflow: t.boolean,
    total: t.number,
    stripped: t.number,
    content: t.array(CreatorStatContent),
  },
  'CreatorStats'
);

export type CreatorStats = t.TypeOf<typeof CreatorStats>;
