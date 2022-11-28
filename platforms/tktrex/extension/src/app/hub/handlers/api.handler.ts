import { getTimeISO8601 } from '@shared/utils/date.utils';
import { APIRequestEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleAPIEvent(e: APIRequestEvent, state: HubState): HubState {
  const apiEvent = {
    ...e.payload,
    type: 'api' as const,
    clientTime: getTimeISO8601(),
    incremental: state.incremental,
  };

  state.content.push(apiEvent);

  state.incremental++;

  return state;
}
