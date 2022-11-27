import * as t from 'io-ts';
import { HTMLContributionEvent } from './HTMLContributionEvent';
import { APIRequestContributionEvent } from './APIRequestContributionEvent';
import { SigiStateContributionEvent } from './SigiStateContributionEvent';

/**
 * Contribution event can be any of:
 *
 * `APIRequestContributionEvent`: the event for tk platform intercepted api requests
 *
 * `HTMLContributionEvent`: the event for the scraped HTML
 *
 * `SigiStateContributionEvent`: the event for the collected SIGI_STATE from html
 */
export const ContributionEvent = t.union(
  [
    HTMLContributionEvent,
    APIRequestContributionEvent,
    SigiStateContributionEvent,
  ],
  'ContributionEvent',
);

export type ContributionEvent = t.TypeOf<typeof ContributionEvent>;
