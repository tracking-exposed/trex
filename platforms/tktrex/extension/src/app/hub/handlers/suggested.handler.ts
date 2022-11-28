import { getTimeISO8601 } from '@shared/utils/date.utils';
import { SuggestedEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleSuggested(e: SuggestedEvent, state: HubState): HubState {
  state.content.push({
    ...e.payload,
    incremental: state.incremental,
    clientTime: getTimeISO8601(),
    type: 'suggested',
  });
  state.incremental++;
  return state;
}
