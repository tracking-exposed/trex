import config from '@shared/extension/config';
import { Hub } from '@shared/extension/hub';
import log from '@shared/extension/logger';
import UserSettings from '@shared/extension/models/UserSettings';
import { bo } from '@shared/extension/utils/browser.utils';
import { countBy } from 'lodash';
import { handleAPIEvent } from './handlers/api.handler';
import { handleNative } from './handlers/native.handler';
import { handleProfile } from './handlers/profile.handler';
import { handleSearch } from './handlers/search.handler';
import { handleSigiState } from './handlers/sigiState.handler';
import { handleSuggested } from './handlers/suggested.handler';
import { handleVideo } from './handlers/video.handler';
import {
  NativeVideoEvent,
  NewVideoEvent,
  ProfileEvent,
  SearchEvent,
  SigiStateEvent,
  SuggestedEvent,
  TKHubEvent,
  APIRequestEvent,
} from './HubEvent';
import { HubState } from './State';

const tkHub = new Hub<TKHubEvent>();

const INTERVAL = config.FLUSH_INTERVAL;

const state: HubState = {
  incremental: 1,
  content: [],
};

function sync(hub: Hub<TKHubEvent>, config: UserSettings): void {
  if (state.content.length) {
    log.info(
      `data sync — ${state.content.length} items (total since beginning: ${state.incremental})`,
      countBy(state.content, 'type'),
    );
    // Send timelines to the page handling the communication with the API.
    // This might be refactored using something compatible to the HUB architecture.
    bo.runtime.sendMessage(
      {
        type: 'sync',
        // ensure all the events sent to the backend
        // have `experimentId`
        payload: state.content.map((c) => ({
          ...c,
          experimentId: config.experimentId,
        })),
        userId: 'local',
      },
      (response) => {
        if (response.type === 'Error') {
          hub.dispatch({
            type: 'ErrorEvent',
            payload: response.error,
          });
        } else {
          state.content = [];
          hub.dispatch({
            type: 'SyncResponse',
            payload: response,
          });
        }
      },
    );
  }
}

export function registerTkHandlers(
  hub: Hub<TKHubEvent>,
  config: UserSettings,
): void {
  if (config.active) {
    const syncInterval = window.setInterval(() => {
      sync(hub, config);
    }, INTERVAL);

    hub
      .on<NewVideoEvent>('NewVideo', (e) => handleVideo(e, state))
      .on<SuggestedEvent>('Suggested', (e) => handleSuggested(e, state))
      .on<SearchEvent>('Search', (e) => handleSearch(e, state))
      .on<ProfileEvent>('Profile', (e) => handleProfile(e, state))
      .on<NativeVideoEvent>('NativeVideo', (e) => handleNative(e, state))
      .on<APIRequestEvent>('APIRequestEvent', (e) => handleAPIEvent(e, state))
      .on<SigiStateEvent>('SigiState', (e) => handleSigiState(e, state))
      .on('WindowUnload', () => {
        clearInterval(syncInterval);
        sync(hub, config);
      });
  }
}

export default tkHub;

export const tkHandlers = {
  handleVideo,
  handleNative,
  handleProfile,
  handleSearch,
  handleSuggested,
  handleAPIEvent,
  handleSigiState,
};
