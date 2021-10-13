import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import { Settings } from 'models/AccountSettings';
import { UpdateAuth, UpdateSettings } from '../models/MessageRequest';
import { sendMessage } from '../providers/browser.provider';
import * as HTTPClient from './HTTPClient';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  settings,
  creatorRecommendations,
  creatorVideos,
  videoRecommendations,
  ccRelatedUsers,
  getAuth,
} from './queries';
import { Queries } from './APIProvider';
import { AuthResponse } from '@backend/models/Auth';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      HTTPClient.post<{ type: string; channelId: string }, AuthResponse>(
        `/v3/creator/${channelId}/register`,
        { type: 'channel', channelId }
      ),
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
    HTTPClient.post(
      `/v3/creator/ogp`,
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ),
  {
    creatorRecommendations,
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, creatorId, recommendations }) => {
    return HTTPClient.post(
      `/v3/creator/updateVideo`,
      {
        creatorId,
        videoId,
        recommendations,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
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
      HTTPClient.post<any, AuthResponse>(`/v3/creator/${channelId}/verify`),
      TE.chain((auth) => updateAuth(auth))
    ),
  {
    creator: Queries.creator.GetCreator,
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
