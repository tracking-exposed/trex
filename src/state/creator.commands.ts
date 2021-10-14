import { AuthResponse } from '@backend/models/Auth';
import { command } from 'avenger';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Settings } from 'models/AccountSettings';
import { UpdateAuth, UpdateSettings } from '../models/MessageRequest';
import { API } from '../providers/api.provider';
import { sendMessage } from '../providers/browser.provider';
import { settings, videoRecommendations } from './public.queries';
import {
  ccRelatedUsers,
  creatorRecommendations,
  creatorVideos,
  getAuth,
  getContentCreator,
} from './creator.queries';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      API.Creator.RegisterCreator({
        Params: { channelId, type: 'channel' },
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
    getAuth,
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
    getContentCreator,
  }
);

export const updateAuth = command(
  (payload?: AuthResponse) => sendMessage({ type: UpdateAuth.value, payload }),
  {
    getAuth,
  }
);

export const copyToClipboard = command((text: string) =>
  TE.tryCatch(() => navigator.clipboard.writeText(text), E.toError)
);
