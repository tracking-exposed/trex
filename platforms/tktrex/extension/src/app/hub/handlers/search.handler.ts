import { getTimeISO8601 } from '@shared/utils/date.utils';
import { SearchEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleSearch(e: SearchEvent, state: HubState): HubState {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
    type: 'search',
  });
  state.incremental++;
  return state;
}

