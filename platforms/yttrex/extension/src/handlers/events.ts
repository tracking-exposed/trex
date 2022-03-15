import { Hub } from '@shared/extension/hub';
import _ from 'lodash';
import config from '@shared/extension/config';
import { getTimeISO8601 } from '@shared/extension/utils/common.utils';
import { bo } from '@shared/extension/utils/browser.utils';
import { NewLeafEvent, NewVideoEvent, YTHubEvent } from '../models/HubEvent';
import ytLog from '../logger';

const INTERVAL = config.FLUSH_INTERVAL;

interface State {
  incremental: number;
  content: any[];
}

export const state: State = {
  incremental: 0,
  content: [],
};

export function handleEvent(e: NewVideoEvent | NewLeafEvent): void {
  state.content.push({
    ...e.payload,
    type: e.type,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
  });
  state.incremental++;
}

export function sync(hub: Hub<YTHubEvent>): void {
  if (state.content.length) {
    const uuids = _.size(_.uniq(_.map(state.content, 'randomUUID')));
    ytLog.debug(
      `sync tot (${state.content.length}/${state.incremental}) ${JSON.stringify(
        _.countBy(state.content, 'type')
      )} with ${uuids} randomUUID(s)`
    );
    // Send timelines to the page handling the communication with the API.
    // This might be refactored using something compatible to the HUB architecture.
    bo.runtime.sendMessage(
      { type: 'sync', payload: state.content, userId: 'local' },
      (response) => {
        ytLog.info('Sync response %O', response);
        hub.dispatch({ type: 'SyncResponse', payload: response });
      }
    );
    state.content = [];
  } else {
    ytLog.debug('No metadata to sync...');
  }
}

export function register(hub: Hub<YTHubEvent>): void {
  hub.on('NewVideo', handleEvent);
  hub.on('leaf', handleEvent);
  hub.on('WindowUnload', () => sync(hub));

  window.setInterval(() => {
    ytLog.debug('Sync at interval %s', INTERVAL);
    sync(hub);
  }, INTERVAL);
}
