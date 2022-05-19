import { countBy } from 'lodash';
import config, { Config } from '@shared/extension/config';
import { getTimeISO8601 } from '@shared/extension/utils/common.utils';
import { Hub } from '@shared/extension/hub';
import {
  NewVideoEvent,
  SuggestedEvent,
  SearchEvent,
  TKHubEvent,
  ProfileEvent,
} from '../models/HubEvent';
import log from '@shared/extension/logger';
import { bo } from '@shared/extension/utils/browser.utils';

interface EvidenceMetaData {
  type: Lowercase<TKHubEvent['type']>;
  clientTime: string;
  incremental: number;
}

type VideoEvidence = NewVideoEvent['payload'] & EvidenceMetaData;
type SuggestedEvidence = SuggestedEvent['payload'] & EvidenceMetaData;
type Evidence = VideoEvidence | SuggestedEvidence;

const INTERVAL = config.FLUSH_INTERVAL;

const now = (): string => getTimeISO8601();

const state = {
  incremental: 0,
  content: [] as Evidence[],
};

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
  } else {
    state.content[videoIndex] = videoEvent;
  }
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

function handleSearch(e: SearchEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'search',
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

export function registerTkHandlers(hub: Hub<TKHubEvent>, config: Config): void {
  if (config.active) {
    hub
      .on('Video', handleVideo)
      .on('Suggested', handleSuggested)
      .on('Search', handleSearch)
      .on('WindowUnload', () => sync(hub))
      .on('Profile', handleProfile);

    window.setInterval(() => {
      sync(hub);
    }, INTERVAL);
  }
}
