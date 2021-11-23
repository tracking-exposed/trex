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
import { Messages } from '../models/Messages';
import { API, APIError, toAPIError } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { apiLogger } from '../utils/logger.utils';

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
  profile?: ContentCreator | null
): TE.TaskEither<APIError, AuthorizedContentCreator> =>
  pipe(
    profile,
    TE.fromPredicate(
      (s): s is AuthorizedContentCreator =>
        s?.registeredOn !== undefined && s.accessToken !== undefined,
      () => new APIError('NotFound', 'Missing Content Creator', [])
    )
  );

export const auth = queryStrict(
  () => sendMessage(Messages.GetAuth)(),
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

export const requiredLocalProfile = compose(
  product({ profile: localProfile }),
  queryStrict(({ profile }) => pipe(profile, throwOnMissingProfile), available)
);

export const profile = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(
    ({ profile }) =>
      pipe(
        API.v3.Creator.GetCreator({
          Headers: { 'x-authorization': profile.accessToken },
        }),
        TE.chain(throwOnMissingProfile)
      ),
    available
  )
);

export const creatorRecommendations = compose(
  product({ profile: requiredLocalProfile, params: param() }),
  queryStrict(
    ({ profile }) =>
      API.v3.Creator.CreatorRecommendations({
        Headers: { 'x-authorization': profile.accessToken },
      }),
    available
  )
);

export const creatorVideos = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }): TE.TaskEither<Error, Video[]> => {
    return API.v3.Creator.CreatorVideos({
      Headers: { 'x-authorization': profile.accessToken },
    });
  }, available)
);

export const oneCreatorVideo = compose(
  product({
    profile: requiredLocalProfile,
    params: param<{ videoId: string }>(),
  }),
  queryShallow(({ profile, params }): TE.TaskEither<Error, Video> => {
    return API.v3.Creator.OneCreatorVideo({
      Headers: { 'x-authorization': profile.accessToken },
      Params: { videoId: params.videoId },
    });
  }, available)
);

export const ccRelatedUsers = compose(
  product({
    profile: requiredLocalProfile,
    params: param<{ amount: number; skip: number }>(),
  }),
  queryShallow(
    ({ profile, params }): TE.TaskEither<Error, ContentCreator[]> => {
      return pipe(
        API.v3.Creator.CreatorRelatedChannels({
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

export const creatorStats = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }) => {
    return pipe(
      API.v3.Creator.GetCreatorStats({
        Params: { channelId: profile.channelId },
      })
    );
  }, available)
);

export const creatorADVStats = compose(
  product({ profile: requiredLocalProfile }),
  queryStrict(({ profile }) => {
    return pipe(
      API.v2.Public.GetChannelADVStats({
        Params: { channelId: profile.channelId },
      })
    );
  }, available)
);
