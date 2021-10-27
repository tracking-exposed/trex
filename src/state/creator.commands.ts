import { AuthResponse } from '@backend/models/Auth';
import { ContentCreator } from '@backend/models/ContentCreator';
import { command } from 'avenger';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
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
      API.Creator.RegisterCreator({
        Params: { channelId },
        Body: { type: 'channel' },
      }),
      TE.chainFirst((payload) => {
        return sendMessage(Messages.UpdateAuth)(payload);
      })
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
      API.Creator.VerifyCreator({ Params: { channelId } }),
      TE.chain(sendMessage(Messages.UpdateContentCreator))
    ),
  {
    localProfile,
    auth,
  }
);

export const pullContentCreatorVideos = command(() =>
  pipe(
    requiredLocalProfile.run(),
    TE.chain((p) =>
      API.Creator.PullCreatorVideos({
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
        API.Creator.CreateRecommendation({
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
  ({ videoId, creatorId, recommendations }) => {
    return pipe(
      profile.run(),
      TE.chain((p) =>
        API.Creator.UpdateVideo({
          Headers: {
            'x-authorization': p?.accessToken,
          },
          Body: {
            creatorId,
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

export const updateAuth = command(
  (payload?: AuthResponse) => sendMessage(Messages.UpdateAuth)(payload),
  {
    auth,
  }
);

export const updateProfile = command(
  (payload?: ContentCreator) =>
    sendMessage(Messages.UpdateContentCreator)(payload),
  {
    profile,
    localProfile,
  }
);

export const copyToClipboard = command((text: string) =>
  TE.tryCatch(() => navigator.clipboard.writeText(text), E.toError)
);
