import { AuthResponse } from '@shared/models/Auth';
import { ContentCreator } from '@shared/models/ContentCreator';
import { command } from 'avenger';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import { API } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import {
  auth,
  ccRelatedUsers,
  creatorRecommendations,
  creatorVideos,
  localProfile,
  profile,
  requiredLocalProfile,
} from './creator.queries';
import { settings, videoRecommendations } from './public.queries';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      API.v3.Creator.RegisterCreator({
        Params: { channelId },
        Body: { type: 'channel' },
      }),
      TE.chainFirst((payload) => sendMessage(Messages.UpdateAuth)(payload))
    ),
  {
    creatorVideos,
    ccRelatedUsers,
    auth,
  }
);

export const verifyChannel = command(
  ({ channelId }: { channelId: string }) =>
    pipe(
      API.v3.Creator.VerifyCreator({ Params: { channelId } }),
      TE.chain(sendMessage(Messages.UpdateContentCreator))
    ),
  {
    localProfile,
    auth,
  }
);

export const pullContentCreatorVideos = command(
  () =>
    pipe(
      requiredLocalProfile.run(),
      TE.chain((p) =>
        API.v3.Creator.PullCreatorVideos({
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
        API.v3.Creator.CreateRecommendation({
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

export const updateRecommendationForVideo = command(
  ({ videoId, recommendations }) => {
    return pipe(
      requiredLocalProfile.run(),
      TE.chain((p) =>
        API.v3.Creator.UpdateVideo({
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
          video: API.v3.Creator.OneCreatorVideo({
            Headers: {
              'x-authorization': p.accessToken,
            },
            Params: { videoId },
          }),
          recommendation: API.v3.Creator.CreateRecommendation({
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

        return updateRecommendationForVideo(
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

export const updateAuth = command(
  (payload: AuthResponse | null) => sendMessage(Messages.UpdateAuth)(payload),
  {
    auth,
  }
);

export const updateProfile = command(
  (payload: ContentCreator | null) =>
    sendMessage(Messages.UpdateContentCreator)(payload),
  {
    profile,
    localProfile,
  }
);

export const copyToClipboard = command((text: string) =>
  TE.tryCatch(() => navigator.clipboard.writeText(text), E.toError)
);

export const assignAccessToken = command(
  ({ token }: { token: string }) => {
    return pipe(
      API.v3.Creator.GetCreator({
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
      TE.chain((creator) => sendMessage(Messages.UpdateContentCreator)(creator))
    );
  },
  {
    localProfile,
  }
);
