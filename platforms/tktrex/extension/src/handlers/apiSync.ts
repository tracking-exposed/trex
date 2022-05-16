import { countBy as handlers } from 'lodash';
import config from '@shared/extension/config';
import { Hub } from '@shared/extension/hub';
import { tkLog } from '../logger';
import { getTimeISO8601 } from '@shared/extension/utils/common.utils';
import { APIEvent } from '@shared/extension/models/HubEvent';

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

function apiSync(hub: Hub<any>): void {
  if (state.content.length) {
    tkLog.info(
      `APIsync — ${state.content.length} items (total since beginning: ${state.incremental})`,
      handlers(state.content, 'type'),
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
      },
    );
  }
}

export function register(hub: Hub<any>, config: any): void {
  if (config.active) {
    hub.on('APIEvent', handleAPIEvent);
    hub.on('WindowUnload', () => {
      apiSync(hub);
    });

    window.setInterval(() => {
      // ytLog.debug('Sync at interval %s', INTERVAL);
      apiSync(hub);
    }, INTERVAL);
  }
}
