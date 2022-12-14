import { TabouleCommands } from '../state/commands';
import * as actions from './actions';
import { APIClients } from './config.type';
import * as inputs from './inputs';
import * as params from './params';
import { tikTokPersonalForYou } from './tiktok/tiktokPersonalForYou';
import { tikTokPersonalNative } from './tiktok/tiktokPersonalNative';
import { tikTokPersonalProfile } from './tiktok/tiktokPersonalProfile';
import { tikTokPersonalSearch } from './tiktok/tiktokPersonalSearch';
import { YCAIccRelatedUsers } from './ycai/ycaiCCRelatedUsers';
import { youtubeGetExperimentList } from './youtube/youtubeGetExperimentList';
import { youtubePersonalHomes } from './youtube/youtubePersonalHomes';
import { youtubePersonalSearches } from './youtube/youtubePersonalSearches';
import { youtubePersonalStats } from './youtube/youtubePersonalStats';
import { youtubePersonalVideos } from './youtube/youtubePersonalVideos';
export interface TabouleConfiguration {
  YCAIccRelatedUsers: ReturnType<typeof YCAIccRelatedUsers>;
  youtubeGetExperimentList: ReturnType<typeof youtubeGetExperimentList>;
  youtubePersonalAds: ReturnType<typeof youtubePersonalStats>;
  youtubePersonalHomes: ReturnType<typeof youtubePersonalHomes>;
  youtubePersonalSearches: ReturnType<typeof youtubePersonalSearches>;
  youtubePersonalVideos: ReturnType<typeof youtubePersonalVideos>;
  tikTokPersonalSearch: ReturnType<typeof tikTokPersonalSearch>;
  tikTokPersonalNative: ReturnType<typeof tikTokPersonalNative>;
  tikTokPersonalProfile: ReturnType<typeof tikTokPersonalProfile>;
  tikTokPersonalForYou: ReturnType<typeof tikTokPersonalForYou>;
}

export const defaultConfiguration = (opts: {
  clients: APIClients;
  commands: TabouleCommands;
  params: any;
}): TabouleConfiguration => {
  return Object.entries({
    YCAIccRelatedUsers,
    youtubeGetExperimentList,
    youtubePersonalSearches,
    youtubePersonalVideos,
    youtubePersonalHomes,
    tikTokPersonalNative,
    tikTokPersonalForYou,
    tikTokPersonalProfile,
    tikTokPersonalSearch,
  }).reduce<any>((acc, [key, fn]) => ({ ...acc, [key]: fn(opts) }), {});
};

export { actions, inputs, params };
