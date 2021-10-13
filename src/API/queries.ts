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
import { GetAuth, GetSettings } from '../models/MessageRequest';
import {
  BackgroundAuthResponse,
  BackgroundSettingsResponse,
} from '../models/MessageResponse';
import { API, APIError } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { apiLogger } from '../utils/logger.utils';
import * as t from 'io-ts';
import { AuthResponse } from '@backend/models/Auth';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

const throwOnMissingAuth = (
  auth?: AuthResponse
): TE.TaskEither<APIError, AuthResponse> =>
  pipe(
    auth,
    TE.fromPredicate(
      (s): s is AuthResponse => s !== undefined,
      () => new APIError('Missing Auth', [])
    )
  );

export const settings = queryShallow(() => {
  return pipe(
    sendMessage<BackgroundSettingsResponse>({ type: GetSettings.value }),
    TE.map(({ response }) => response)
  );
}, available);

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

// content creator

export const getContentCreator = compose(
  product({ getAuth }),
  queryStrict(
    ({ getAuth }) =>
      pipe(
        throwOnMissingAuth(getAuth),
        TE.chain((auth) =>
          API.Creator.GetCreator({ Params: { channelId: auth.channelId } })
        )
      ),
    available
  )
);

export const creatorRecommendations = compose(
  product({ getAuth, params: param() }),
  queryStrict(
    ({ getAuth }) =>
      pipe(
        throwOnMissingAuth(getAuth),
        TE.chain((auth) =>
          API.Creator.CreatorRecommendations({
            Params: { channelId: auth.channelId },
          })
        )
      ),

    available
  )
);

export const creatorVideos = compose(
  settings,
  queryStrict((settings): TE.TaskEither<Error, Video[]> => {
    if (settings.channelCreatorId !== null) {
      return API.Creator.CreatorVideos({
        Params: { channelId: settings.channelCreatorId },
      });
    }
    return TE.right([]);
  }, available)
);

export const recommendedChannels = compose(
  product({ settings, params: param() }),
  queryStrict(({ settings, params }) => {
    if (settings.channelCreatorId !== null) {
      return API.request(
        {
          url: `/v3/profile/recommendations/${settings.channelCreatorId}`,
          params,
        },
        t.any.decode
      );
    }
    return TE.right([]);
  }, available)
);

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }): TE.TaskEither<Error, Recommendation[]> =>
    API.Public.VideoRecommendations({ Params: { videoId } }),
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
      API.Creator.CreatorRelatedChannels({
        Params: { channelId, amount, skip: 0 },
      }),
      TE.map((d) => d.content)
    ),
  available
);
