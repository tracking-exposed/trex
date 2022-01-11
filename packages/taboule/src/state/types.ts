import * as t from 'io-ts';

export const TabouleQueryKey = t.union(
  [
    t.literal('ccRelatedUsers'),
    t.literal('getExperimentById'),
    t.literal('getExperimentList'),
    t.literal('personalSearches'),
    t.literal('personalVideos'),
    t.literal('personalHomes'),
    t.literal('personalAds'),
    t.literal('tikTokPersonalHTMLSummary'),
    t.literal('tikTokPersonalMetadataSummary'),
    t.literal('tikTokSearches'),
  ],
  'TabouleQueryKey'
);
export type TabouleQueryKey = t.TypeOf<typeof TabouleQueryKey>;
