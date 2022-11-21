import { getTimeISO8601 } from '@shared/utils/date.utils';
import { NativeVideoEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleNative(e: NativeVideoEvent, state: HubState): HubState {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
    type: 'native',
  });
  state.incremental++;
  return state;
}
