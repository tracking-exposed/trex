import { ContentCreator } from '@backend/models/ContentCreator';
import { Recommendation } from '@backend/models/Recommendation';
import { Video } from '@backend/models/Video';
import {
  available,
  compose,
  param,
  product,
  queryShallow,
  queryStrict,
} from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  BackgroundSettingsResponse,
  BackgroundAuthResponse,
} from '../models/MessageResponse';
import { GetAuth, GetSettings } from '../models/MessageRequest';
import { sendMessage } from '../providers/browser.provider';
import * as HTTPClient from './HTTPClient';
import { apiLogger } from '../utils/logger.utils';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

export const settings = queryShallow(() => {
  return pipe(
    sendMessage<BackgroundSettingsResponse>({ type: GetSettings.value }),
    TE.map(({ response }) => response)
  );
}, available);

export const creatorRecommendations = compose(
  product({ settings, params: param() }),
  queryShallow(
    ({ settings, params }) =>
      HTTPClient.get<Recommendation[]>(
        `/v3/creator/recommendations/${settings.publicKey}`,
        params
      ),
    available
  )
);

export const creatorVideos = compose(
  settings,
  queryStrict((settings): TE.TaskEither<Error, Video[]> => {
    if (settings.channelCreatorId !== null) {
      return HTTPClient.get(`/v3/creator/videos/${settings.channelCreatorId}`);
    }
    return TE.right([]);
  }, available)
);

export const recommendedChannels = compose(
  product({  settings, params: param() }),
  queryStrict(({ settings, params }) => {
    if (settings.channelCreatorId !== null) {
      return HTTPClient.get(
        `/v3/profile/recommendations/${settings.channelCreatorId}`,
        params
      );
    }
    return TE.right([]);
  }, available)
);

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }): TE.TaskEither<Error, Recommendation[]> =>
    HTTPClient.get(`/v3/video/${videoId}/recommendations`),
  available
);

export const ccRelatedUsers = queryShallow(
  ({
    channelId,
    amount,
  }: {
    channelId: string;
    amount: number;
  }): TE.TaskEither<Error, ContentCreator[]> =>
    pipe(
      HTTPClient.get<any>(`/v3/creator/${channelId}/related/${amount}-0`),
      TE.map((d) => d.content)
    ),
  available
);

export const getAuth = queryShallow(
  () =>
    pipe(
      sendMessage<BackgroundAuthResponse>({ type: GetAuth.value }),
      TE.map((r) => {
        apiLogger.debug('Get auth %O', r);
        return r;
      }),
      TE.map((r) => r.response)
    ),
  available
);
