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
    t.literal('tikTokPersonalSearch'),
    t.literal('tikTokSearches'),
  ],
  'TabouleQueryKey'
);
export type TabouleQueryKey = t.TypeOf<typeof TabouleQueryKey>;

export interface selectedRecommendation {
  elems: number;
  index: number;
  isLive: boolean;
  label: string;
  publicationTime: Date;
  recommendedDisplayL: string;
  recommendedHref: string;
  recommendedLength: number;
  recommendedLengthText: string;
  recommendedRelativeSeconds: number;
  recommendedSource: string;
  recommendedTitle: string;
  recommendedViews: number;
  sectionName: string;
  thumbnailHref: string | undefined;
  timePrecision: string;
  verified: boolean;
  videoId: string;
}
