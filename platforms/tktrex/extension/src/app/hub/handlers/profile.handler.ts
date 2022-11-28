import { getTimeISO8601 } from '@shared/utils/date.utils';
import { ProfileEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleProfile(e: ProfileEvent, state: HubState): HubState {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
    type: 'profile',
  });
  state.incremental++;
  return state;
}
