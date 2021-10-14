import { AuthResponse } from '@backend/models/Auth';
import { command } from 'avenger';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Settings } from 'models/AccountSettings';
import { doUpdateCurrentView } from 'utils/location.utils';
import { UpdateAuth, UpdateSettings } from '../models/MessageRequest';
import { API } from '../providers/api.provider';
import { sendMessage, toBrowserError } from '../providers/browser.provider';
import {
  ccRelatedUsers,
  creatorRecommendations,
  creatorVideos,
  auth,
  profile
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
        return sendMessage({
          type: UpdateAuth.value,
          payload,
        });
      })
    ),
  {
    creatorVideos,
    ccRelatedUsers,
    auth,
  }
);

export const addRecommendation = command(
  ({ url }: { url: string }) =>
    API.Creator.CreateRecommendation({ Body: { url } }),
  {
    creatorRecommendations,
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, creatorId, recommendations }) => {
    return API.Creator.UpdateVideo({
      Body: {
        creatorId,
        videoId,
        recommendations,
      },
    });
  },
  {
    settings,
    videoRecommendations,
  }
);

export const updateSettings = command(
  (payload: Settings) =>
    sendMessage({ type: UpdateSettings.value, payload: payload }),
  { accountSettings: settings, creatorRecommendations, creatorVideos }
);

export const verifyChannel = command(
  ({ channelId }: { channelId: string }) =>
    pipe(
      API.Creator.VerifyCreator({ Params: { channelId } }),
      TE.chain((auth) => updateAuth(auth))
    ),
  {
    profile,
  }
);

export const updateAuth = command(
  (payload?: AuthResponse) =>
    pipe(
      sendMessage({ type: UpdateAuth.value, payload }),
      TE.chain(() =>
        pipe(
          doUpdateCurrentView({ view: 'index' }),
          TE.mapLeft(toBrowserError)
        )
      )
    ),
  {
    auth,
  }
);

export const copyToClipboard = command((text: string) =>
  TE.tryCatch(() => navigator.clipboard.writeText(text), E.toError)
);
