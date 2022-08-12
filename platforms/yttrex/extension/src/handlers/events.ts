import { Hub } from '@shared/extension/hub';
import _ from 'lodash';
import config from '@shared/extension/config';
import { UserSettings } from '@shared/extension/models/UserSettings';
import { getTimeISO8601 } from '@shared/extension/utils/common.utils';
import { bo } from '@shared/extension/utils/browser.utils';
import { NewLeafEvent, NewVideoEvent, YTHubEvent } from '../models/HubEvent';
import ytLog from '../logger';

const INTERVAL = parseInt(config.FLUSH_INTERVAL as any as string, 10);

interface State {
  incremental: number;
  content: any[];
}

export const state: State = {
  incremental: 0,
  content: [],
};

export function handleVideo(e: NewVideoEvent): void {
  state.content.push({
    ...e.payload,
    type: 'video',
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
  });
  state.incremental++;
}

export function handleLeaf(e: NewLeafEvent): void {
  state.content.push({
    ...e.payload,
    type: 'leaf',
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
  });
  state.incremental++;
}

export function sync(hub: Hub<YTHubEvent>, config: UserSettings): void {
  if (state.content.length) {
    const uuids = _.size(_.uniq(_.map(state.content, 'randomUUID')));
    ytLog.debug(
      `sync tot (${state.content.length}/${state.incremental}) ${JSON.stringify(
        _.countBy(state.content, 'type')
      )} with ${uuids} randomUUID(s)`
    );

    const payload = state.content.map((c) => ({
      ...c,
      researchTag: config.researchTag,
      experimentId: config.experimentId,
    }));
    // Send timelines to the page handling the communication with the API.
    // This might be refactored using something compatible to the HUB architecture.
    bo.runtime.sendMessage(
      { type: 'sync', payload, userId: 'local' },
      (response: any) => {
        ytLog.info('Sync response %j', response);
        hub.dispatch({ type: 'SyncResponse', payload: response });
      }
    );
    state.content = [];
  } else {
    // ytLog.debug('No metadata to sync...');
  }
}

export function register(hub: Hub<YTHubEvent>, config: UserSettings): void {
  if (config.active) {
    const syncInterval = window.setInterval(() => {
      // ytLog.debug('Sync at interval %s', INTERVAL);
      sync(hub, config);
    }, INTERVAL);

    hub.on('NewVideo', handleVideo);
    hub.on('leaf', handleLeaf);
    hub.on('WindowUnload', () => {
      clearInterval(syncInterval);
      sync(hub, config);
    });
  }
}
