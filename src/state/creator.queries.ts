import { ContentCreator } from '@backend/models/ContentCreator';
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
import * as t from 'io-ts';
import { Messages } from '../models/Messages';
import { API, APIError, toAPIError } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { apiLogger } from '../utils/logger.utils';
import { settings } from './public.queries';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

// const throwOnMissingAuth = (
//   auth?: AuthResponse
// ): TE.TaskEither<APIError, AuthResponse> =>
//   pipe(
//     auth,
//     TE.fromPredicate(
//       (s): s is AuthResponse => s?.verified ?? false,
//       () => new APIError('Missing Auth', [])
//     )
//   );

type AuthorizedContentCreator = Omit<ContentCreator, 'accessToken'> & {
  accessToken: string;
};

const throwOnMissingProfile = (
  profile?: ContentCreator
): TE.TaskEither<APIError, AuthorizedContentCreator> =>
  pipe(
    profile,
    TE.fromPredicate(
      (s): s is AuthorizedContentCreator =>
        s?.registeredOn !== undefined && s.accessToken !== undefined,
      () => new APIError('Missing Content Creator', [])
    )
  );

export const auth = queryStrict(
  () =>
    pipe(
      sendMessage(Messages.GetAuth)(),
      TE.map((r) => {
        apiLogger.debug('Get auth %O', r);
        return r;
      })
    ),
  available
);

// content creator

export const localProfile = queryStrict(
  () =>
    pipe(
      sendMessage(Messages.GetContentCreator)(),
      TE.map((r) => {
        apiLogger.debug('Get profile %O', r);
        return r;
      }),
      TE.mapLeft(toAPIError)
    ),
  available
);

export const profile = compose(
  product({ profile: localProfile }),
  queryStrict(
    ({ profile }) =>
      pipe(
        throwOnMissingProfile(profile),
        TE.chain((p) =>
          API.Creator.GetCreator({
            Headers: { 'x-authorization': p.accessToken },
          })
        ),
        TE.chain(throwOnMissingProfile)
      ),
    available
  )
);

export const creatorRecommendations = compose(
  product({ profile, params: param() }),
  queryStrict(
    ({ profile }) =>
      API.Creator.CreatorRecommendations({
        Headers: { 'x-authorization': profile.accessToken },
        Params: { channelId: profile.channelId },
      }),
    available
  )
);

export const creatorVideos = compose(
  product({ profile }),
  queryStrict(({ profile }): TE.TaskEither<Error, Video[]> => {
    return API.Creator.CreatorVideos({
      Headers: { 'x-authorization': profile.accessToken },
      Params: {
        channelId: profile.channelId,
      },
    });
  }, available)
);

export const recommendedChannels = compose(
  product({ settings, params: param() }),
  queryStrict(({ settings, params }) => {
    if (
      settings?.channelCreatorId !== undefined &&
      settings?.channelCreatorId !== null
    ) {
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
  product({ profile, params: param<{ amount: number; skip: number }>() }),
  queryShallow(
    ({ profile, params }): TE.TaskEither<Error, ContentCreator[]> => {
      return pipe(
        API.Creator.CreatorRelatedChannels({
          Headers: {
            'x-authorization': profile.accessToken,
          },
          Params: {
            channelId: profile.channelId,
            amount: params.amount,
            skip: params.skip,
          },
        }),
        TE.map((d) => d.content)
      );
    },
    available
  )
);
