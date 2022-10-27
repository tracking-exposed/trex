import { TabouleQueryKey } from '../state/types';

type TabouleDefaultParams = { [K in TabouleQueryKey]: any };

export const defaultParams: TabouleDefaultParams = {
  YCAIccRelatedUsers: {},
  youtubeGetExperimentById: {},
  youtubeGetExperimentList: {
    type: 'comparison',
    key: 'fuffa',
    // this is the default as per 'yarn backend watch'
  },
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
