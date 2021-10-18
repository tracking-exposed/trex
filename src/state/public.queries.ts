import { Recommendation } from '@backend/models/Recommendation';
import {
  available, queryShallow
} from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { API } from 'providers/api.provider';
import { GetSettings } from '../models/MessageRequest';
import {
  BackgroundSettingsResponse
} from '../models/MessageResponse';
import { sendMessage } from '../providers/browser.provider';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';


export const settings = queryShallow(() => {
  return pipe(
    sendMessage<BackgroundSettingsResponse>({ type: GetSettings.value }),
    TE.map(({ response }) => response)
  );
}, available);

// public

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }): TE.TaskEither<Error, Recommendation[]> =>
    API.Public.VideoRecommendations({ Params: { videoId } }),
  available
);