import * as sharedConst from '@shared/constants';
import { AppError } from '@shared/errors/AppError';
import { AuthResponse } from '@shared/models/Auth';
import { ContentCreator } from '@shared/models/ContentCreator';
import { PartialRecommendation } from '@shared/models/Recommendation';
import { setItem } from '@shared/providers/localStorage.provider';
import { command } from 'avenger';
import { sequenceS } from 'fp-ts/lib/Apply';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  API as AuthAPI,
  auth,
  creatorRecommendations,
  creatorVideos,
  accountLinkCompleted,
  ACCOUNT_LINK_COMPLETED,
  localProfile,
  profile,
  requiredLocalProfile,
} from './creator.queries';
import {
  settings,
  videoRecommendations,
  API as PublicAPI,
} from './public.queries';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      PublicAPI.v3.Creator.RegisterCreator({
        Params: { channelId },
        Body: { type: 'channel' },
      }),
      TE.chainFirst((payload) =>
        TE.fromIO(setItem(sharedConst.AUTH_KEY, payload))
      )
    ),
  {
    auth,
  }
);

export const verifyChannel = command(
  ({ channelId }: { channelId: string }) =>
    pipe(
      PublicAPI.v3.Creator.VerifyCreator({ Params: { channelId } }),
      TE.chain((cc) => TE.fromIO(setItem(sharedConst.CONTENT_CREATOR, cc)))
    ),
  {
    localProfile,
    auth,
    requiredLocalProfile
  }
);

export const pullContentCreatorVideos = command(
  () =>
    pipe(
      requiredLocalProfile.run(),
      TE.chain((p) =>
        AuthAPI.v3.Creator.PullCreatorVideos({
          Headers: {
            'x-authorization': p.accessToken,
          },
        })
      )
    ),
  {
    creatorVideos,
  }
);

export const addRecommendation = command(
  ({ url }: { url: string }) =>
    pipe(
      profile.run(),
      TE.chain((p) =>
        AuthAPI.v3.Creator.CreateRecommendation({
          Headers: {
            'x-authorization': p.accessToken,
          },
          Body: { url },
        })
      )
    ),
  {
    creatorRecommendations,
  }
);

export const updateRecommendationsForVideo = command(
  ({ videoId, recommendations }) => {
    return pipe(
      requiredLocalProfile.run(),
      TE.chain((p) =>
        AuthAPI.v3.Creator.UpdateVideo({
          Headers: {
            'x-authorization': p.accessToken,
          },
          Body: {
            videoId,
            recommendations,
          },
        })
      )
    );
  },
  {
    settings,
    videoRecommendations,
  }
);

export const addRecommendationForVideo = command(
  ({
    videoId,
    recommendationURL,
  }: {
    videoId: string;
    recommendationURL: string;
  }) =>
    pipe(
      profile.run(),
      TE.chain((p) =>
        sequenceS(TE.ApplicativePar)({
          video: AuthAPI.v3.Creator.OneCreatorVideo({
            Headers: {
              'x-authorization': p.accessToken,
            },
            Params: { videoId },
          }),
          recommendation: AuthAPI.v3.Creator.CreateRecommendation({
            Headers: {
              'x-authorization': p.accessToken,
            },
            Body: { url: recommendationURL },
          }),
        })
      ),
      TE.chain(({ video, recommendation }) => {
        if (
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          video.recommendations.includes(recommendation.urlId)
        ) {
          return TE.right(video);
        }

        return updateRecommendationsForVideo(
          {
            videoId,
            recommendations: video.recommendations.concat(recommendation.urlId),
          },
          {
            videoRecommendations: { videoId },
          }
        );
      })
    ),
  {
    videoRecommendations,
  }
);

export const patchRecommendation = command(
  ({ urlId, data }: { urlId: string; data: PartialRecommendation }) =>
    pipe(
      profile.run(),
      TE.chain((p) => {
        return AuthAPI.v3.Creator.PatchRecommendation({
          Headers: {
            'x-authorization': p.accessToken,
          },
          Params: { urlId },
          Body: data,
        });
      })
    )
);

export const deleteRecommendation = command(
  ({ urlId }: { urlId: string }) =>
    pipe(
      profile.run(),
      TE.chain((p) => {
        return AuthAPI.v3.Creator.DeleteRecommendation({
          Headers: {
            'x-authorization': p.accessToken,
          },
          Params: { urlId },
        });
      })
    ),
  {
    creatorRecommendations,
  }
);

export const updateAuth = command(
  (payload: AuthResponse | null) =>
    TE.fromIO<any, AppError>(setItem(sharedConst.AUTH_KEY, payload)),
  {
    auth,
  }
);

export const updateAccountLinkCompleted = command(
  ({ completed }: { completed: true }) =>
    TE.fromIO<any, AppError>(setItem(ACCOUNT_LINK_COMPLETED, completed)),
  {
    accountLinkCompleted,
  }
);

export const updateProfile = command(
  (payload: ContentCreator | null) =>
    TE.fromIO<any, AppError>(setItem(sharedConst.CONTENT_CREATOR, payload)),
  {
    profile,
    localProfile,
  }
);

export const deleteProfile = command(
  () => TE.fromIO(setItem(sharedConst.CONTENT_CREATOR, null)),
  { profile }
);

export const assignAccessToken = command(
  ({ token }: { token: string }) => {
    return pipe(
      PublicAPI.v3.Creator.GetCreator({
        Headers: {
          'x-authorization': token,
        },
      }),
      TE.orElse((e) => {
        // todo: define a proper NotFound error
        const isNotFoundError =
          e.message === 'Request failed with status code 500';
        if (isNotFoundError) {
          return TE.left({ message: 'The given access token is not valid.' });
        }
        return TE.left(e);
      }),
      TE.chain((creator) =>
        TE.fromIO(setItem(sharedConst.CONTENT_CREATOR, creator))
      )
    );
  },
  {
    localProfile,
  }
);
