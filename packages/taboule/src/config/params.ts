import { TabouleQueryKey } from '../state/types';

type TabouleDefaultParams = { [K in TabouleQueryKey]: any };

export const defaultParams: TabouleDefaultParams = {
  YCAIccRelatedUsers: {},
  youtubeGetExperimentById: {},
  youtubeGetExperimentList: {},
  youtubePersonalHomes: {},
  youtubePersonalSearches: {},
  youtubePersonalVideos: {},
  youtubePersonalAds: {},
  tikTokPersonalHTMLSummary: {},
  tikTokPersonalSearch: {},
  tikTokPersonalForYou: {},
  tikTokPersonalProfile: {},
  tikTokPersonalNative: {},
};
