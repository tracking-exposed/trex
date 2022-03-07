import { countBy } from 'lodash';
import config from '../config';
import { Hub } from '../hub';
import log from '../logger';
import { APIEvent } from '../models/HubEvent';
import { getTimeISO8601 } from '../utils';

interface Evidence {
  payload: APIEvent['payload'];
  clientTime: string;
  incremental: number;
}

const bo = chrome;

const INTERVAL = config.FLUSH_INTERVAL;

const now = (): string => getTimeISO8601();

const state = {
  incremental: 0,
  content: [] as Evidence[],
};

function handleAPIEvent(e: APIEvent): void {
  const apiEvent = {
    payload: e.payload,
    clientTime: now(),
    incremental: state.incremental,
  };

  state.content.push(apiEvent);

  state.incremental++;
}

function apiSync(hub: Hub): void {
  if (state.content.length) {
    log.info(
      `APIsync — ${state.content.length} items (total since beginning: ${state.incremental})`,
      countBy(state.content, 'type')
    );
    // Send timelines to the page handling the communication with the API.
    // This might be refactored using something compatible to the HUB architecture.
    bo.runtime.sendMessage(
      {
        type: 'apiSync',
        payload: state.content,
        userId: 'local',
      },
      (response) => {
        hub.dispatch({
          type: 'APISyncResponse',
          payload: response,
        });
        state.content = [];
      }
    );
  }
}

export function register(hub: Hub): void {
  hub.on('APIEvent', handleAPIEvent).on('WindowUnload', () => apiSync(hub));

  window.setInterval(() => apiSync(hub), INTERVAL);
}
