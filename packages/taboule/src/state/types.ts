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
  recommendedThumbnail: string;
  recommendedViews: number;
  sectionName: string;
  thumbnailHref: string | undefined;
  timePrecision: string;
  title: string;
  verified: boolean;
  videoId: string;
  views: number;
}
