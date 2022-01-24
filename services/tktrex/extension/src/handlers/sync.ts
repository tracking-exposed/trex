import { countBy } from 'lodash';

import config from '../config';
import { getTimeISO8601 } from '../utils';
import { Hub } from '../hub';
import { NewVideoEvent, SuggestedEvent, SearchEvent } from '../models/HubEvent';

import log from '../logger';

interface EvidenceMetaData {
  type: 'video' | 'suggested' | 'search';
  clientTime: string;
  incremental: number;
}

type VideoEvidence = NewVideoEvent['payload'] & EvidenceMetaData;
type SuggestedEvidence = SuggestedEvent['payload'] & EvidenceMetaData;
type Evidence = VideoEvidence | SuggestedEvidence;

const bo = chrome;

const INTERVAL = config.FLUSH_INTERVAL;

const now = (): string => getTimeISO8601();

const state = {
  incremental: 0,
  content: [] as Evidence[],
};

function handleVideo(e: NewVideoEvent): void {
  state.content.push({
    ...e.payload,
    clientTime: now(),
    type: 'video',
    incremental: state.incremental,
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

function handleSearch(e: SearchEvent): void {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: now(),
    type: 'search',
  });
  state.incremental++;
}

function sync(hub: Hub): void {
  if (state.content.length) {
    log.info.strong(
      `synchronizing ${state.content.length} new items (total since beginning of session: ${state.incremental})`,
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
      (response) =>
        hub.dispatch({
          type: 'SyncResponse',
          payload: response,
        }),
    );
    state.content = [];
  }
}

export function register(hub: Hub): void {
  hub
    .on('NewVideo', handleVideo)
    .on('Suggested', handleSuggested)
    .on('Search', handleSearch)
    .on('WindowUnload', () => sync(hub));

  window.setInterval(() => sync(hub), INTERVAL);
}
