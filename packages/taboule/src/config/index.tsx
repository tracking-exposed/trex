import { ChannelRelated } from '@shared/models/ChannelRelated';
import { GuardoniExperiment } from '@shared/models/Experiment';
import {
  ForYouMetadata as TKForYouMetadata,
  NativeMetadata as TikTokNativeMetadata,
  ProfileMetadata as TKProfileMetadata,
  SearchMetadata as TikTokSearchMetadata
} from '@tktrex/shared/models/metadata';
import {
  HomeMetadata as YTHomeMetadata,
  SearchMetadata as YTSearchMetadata, VideoMetadata as YTVideoMetadata
} from '@yttrex/shared/models/metadata/Metadata';
import { TabouleCommands } from '../state/commands';
import * as actions from './actions';
import { TabouleQueryConfiguration } from './config.type';
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
import { youtubePersonalVideos } from './youtube/youtubePersonalVideos';

interface TabouleConfiguration {
  YCAIccRelatedUsers: TabouleQueryConfiguration<ChannelRelated>;
  youtubeGetExperimentList: TabouleQueryConfiguration<GuardoniExperiment>;
  youtubePersonalAds: TabouleQueryConfiguration<{}>;
  youtubePersonalHomes: TabouleQueryConfiguration<YTHomeMetadata>;
  youtubePersonalSearches: TabouleQueryConfiguration<YTSearchMetadata>;
  youtubePersonalVideos: TabouleQueryConfiguration<YTVideoMetadata>;
  tikTokPersonalSearch: TabouleQueryConfiguration<TikTokSearchMetadata>;
  tikTokPersonalNative: TabouleQueryConfiguration<TikTokNativeMetadata>;
  tikTokPersonalProfile: TabouleQueryConfiguration<TKProfileMetadata>;
  tikTokPersonalForYou: TabouleQueryConfiguration<TKForYouMetadata>;
}

export const defaultConfiguration = (
  commands: TabouleCommands,
  params: any
): TabouleConfiguration => {
  return {
    YCAIccRelatedUsers: YCAIccRelatedUsers(commands, params),
    youtubeGetExperimentList: youtubeGetExperimentList(commands, params),
    youtubePersonalSearches: youtubePersonalSearches(commands, params),
    youtubePersonalVideos: youtubePersonalVideos(commands,params),
    youtubePersonalAds: {
      inputs: inputs.publicKeyInput,
      columns: [],
    },
    youtubePersonalHomes: youtubePersonalHomes(commands, params),

    tikTokPersonalNative: tikTokPersonalNative(commands, params),
    tikTokPersonalForYou: tikTokPersonalForYou(commands, params),
    tikTokPersonalProfile: tikTokPersonalProfile(commands, params),
    tikTokPersonalSearch: tikTokPersonalSearch(commands, params),
  };
};

export { actions, inputs, params };
