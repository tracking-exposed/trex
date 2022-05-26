/**
 * @module config!params
 */
import { TabouleQueryKey } from '../state/types';

type TabouleDefaultParams = { [K in TabouleQueryKey]: any };

/**
 * Default query params
 */
export const defaultParams: TabouleDefaultParams = {
  ccRelatedUsers: {},
  getExperimentById: {},
  getExperimentList: {
    type: 'comparison',
    key: 'fuffa', // this is the default as per 'yarn backend watch'
  },
  personalHomes: {},
  personalSearches: {},
  personalVideos: {},
  personalAds: {},
  tikTokPersonalHTMLSummary: {},
  tikTokPersonalSearch: {},
  tikTokSearches: {},
};
