import { AuthResponse } from '@backend/models/Auth';
import { ContentCreator } from '@backend/models/ContentCreator';
import { Video } from '@backend/models/Video';
import {
  available,
  compose,
  param,
  product,
  queryShallow,
  queryStrict
} from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { GetAuth } from '../models/MessageRequest';
import { BackgroundAuthResponse } from '../models/MessageResponse';
import { API, APIError } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { apiLogger } from '../utils/logger.utils';
import { settings } from './public.queries';

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
  getAuth,
  queryStrict((auth): TE.TaskEither<Error, Video[]> => {
    return pipe(
      throwOnMissingAuth(auth),
      TE.chain((auth) =>
        API.Creator.CreatorVideos({
          Params: { channelId: auth.channelId },
        })
      )
    );
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

export const ccRelatedUsers = compose(
  product({  getAuth, params: param<{ amount: number; skip: number }>() }),
  queryShallow(({getAuth, params }): TE.TaskEither<Error, ContentCreator[]> => {
    return pipe(
      throwOnMissingAuth(getAuth),
      TE.chain((auth) =>
        API.Creator.CreatorRelatedChannels({
          Params: { channelId: auth.channelId, amount: params.amount, skip: params.skip },
        })
      ),
      TE.map((d) => d.content)
    );
  }, available)
);
