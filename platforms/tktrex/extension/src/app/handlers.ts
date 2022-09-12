import config from '@shared/extension/config';
import { Hub } from '@shared/extension/hub';
import log from '@shared/extension/logger';
import UserSettings from '@shared/extension/models/UserSettings';
import { bo } from '@shared/extension/utils/browser.utils';
import { getTimeISO8601 } from '@shared/extension/utils/common.utils';
import { countBy } from 'lodash';
import {
  NativeVideoEvent,
  NewVideoEvent,
  ProfileEvent,
  SearchEvent,
  SuggestedEvent,
  TKHubEvent,
} from '../models/HubEvent';

interface EvidenceMetaData {
  type: 'video' | 'suggested' | 'search' | 'profile' | 'native';
  clientTime: string;
  incremental: number;
}

type VideoEvidence = NewVideoEvent['payload'] & EvidenceMetaData;
type SuggestedEvidence = SuggestedEvent['payload'] & EvidenceMetaData;
type Evidence = VideoEvidence | SuggestedEvidence;

const INTERVAL = config.FLUSH_INTERVAL;

const now = (): string => getTimeISO8601();

const state = {
  incremental: 1,
  content: [] as Evidence[],
};

export const hub = new Hub<TKHubEvent>();

export function handleVideo(e: NewVideoEvent): void {
  const videoEvent = {
    ...e.payload,
    clientTime: now(),
    type: 'video' as const,
    incremental: state.incremental,
  };

  const videoIndex = state.content.findIndex(
    (ee) => e.payload.href === ee.href,
  );

  if (videoIndex < 0) {
    state.content.push(videoEvent);
    state.incremental++;
  } else {
    state.content[videoIndex] = videoEvent;
  }
}

function handleNative(e: NativeVideoEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'native',
  });
  state.incremental++;
}

function handleSuggested(e: SuggestedEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'suggested',
  });
  state.incremental++;
}

function handleProfile(e: ProfileEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'profile',
  });
  state.incremental++;
}

function handleSearch(e: SearchEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'search',
  });
  state.incremental++;
}

function sync(hub: Hub<TKHubEvent>): void {
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
        payload: state.content,
        userId: 'local',
      },
      (response) => {
        hub.dispatch({
          type: 'SyncResponse',
          payload: response,
        });
      },
    );
    state.content = [];
  }
}

export function registerTkHandlers(
  hub: Hub<TKHubEvent>,
  config: UserSettings,
): void {
  if (config.active) {
    const syncInterval = window.setInterval(() => {
      sync(hub);
    }, INTERVAL);

    hub
      .on('NewVideo', handleVideo)
      .on('Suggested', handleSuggested)
      .on('Search', handleSearch)
      .on('Profile', handleProfile)
      .on('NativeVideo', handleNative)
      .on('WindowUnload', () => {
        clearInterval(syncInterval);
        sync(hub);
      });
  }
}
