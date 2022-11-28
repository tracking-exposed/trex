import { getTimeISO8601 } from '@shared/utils/date.utils';
import { NewVideoEvent } from '../HubEvent';

const now = (): string => getTimeISO8601();

export function handleVideo(e: NewVideoEvent, state: any): void {
  const videoEvent = {
    ...e.payload,
    clientTime: now(),
    type: 'video' as const,
    incremental: state.incremental,
  };

  const videoIndex = state.content.findIndex(
    (ee: any) => e.payload.href === ee.href,
  );

  if (videoIndex < 0) {
    state.content.push(videoEvent);
    state.incremental++;
  } else {
    state.content[videoIndex] = videoEvent;
  }
  return state;
}
