import { getTimeISO8601 } from '@shared/utils/date.utils';
import { SigiStateEvent } from '../HubEvent';
import { HubState } from '../State';

export function handleSigiState(e: SigiStateEvent, state: HubState): HubState {
  const sigiState = {
    ...e.payload,
    type: 'sigiState' as const,
    clientTime: getTimeISO8601(),
    incremental: state.incremental,
  };

  state.content.push(sigiState);
  state.incremental++;
  return state;
}
