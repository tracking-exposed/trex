import * as t from 'io-ts';

export const TabouleQueryKey = t.union(
  [
    t.literal('YCAIccRelatedUsers'),
    t.literal('youtubeGetExperimentById'),
    t.literal('youtubeGetExperimentList'),
    t.literal('youtubePersonalSearches'),
    t.literal('youtubePersonalVideos'),
    t.literal('youtubePersonalHomes'),
    t.literal('youtubePersonalAds'),
    t.literal('tikTokPersonalHTMLSummary'),
    t.literal('tikTokPersonalSearch'),
    t.literal('tikTokPersonalNative'),
    t.literal('tikTokSearches'),
  ],
  'TabouleQueryKey'
);
export type TabouleQueryKey = t.TypeOf<typeof TabouleQueryKey>;
