import { Recommendation } from '@backend/models/Recommendation';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { API } from '../providers/api.provider';
import { GetKeypair, GetSettings } from '../models/MessageRequest';
import {
  BackgroundKeypairResponse,
  BackgroundSettingsResponse,
} from '../models/MessageResponse';
import { Settings } from '../models/Settings';
import { sendMessage, toBrowserError } from '../providers/browser.provider';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

export const settings = queryShallow(() => {
  return pipe(
    sendMessage<BackgroundSettingsResponse>({ type: GetSettings.value }),
    TE.filterOrElse(
      (r): r is Settings => r !== undefined,
      () => toBrowserError(new Error())
    )
  );
}, available);

export const keypair = queryStrict(() => {
  return sendMessage<BackgroundKeypairResponse>({ type: GetKeypair.value });
}, refetch);

// public

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }): TE.TaskEither<Error, Recommendation[]> =>
    API.Public.VideoRecommendations({ Params: { videoId } }),
  available
);
