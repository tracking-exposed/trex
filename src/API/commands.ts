import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import { AccountSettings } from 'models/AccountSettings';
import { ConfigUpdate } from 'models/MessageRequest';
import { sendMessage } from '../providers/browser.provider';
import * as HTTPClient from './HTTPClient';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  accountSettings,
  creatorRecommendations,
  creatorVideos,
  videoRecommendations,
  ccRelatedUsers,
} from './queries';
import { Queries } from './APIProvider';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      HTTPClient.post(`/v3/creator/${channelId}/register`, { type: 'channel' }),
      TE.chainFirst(() =>
        pipe(
          accountSettings.run(),
          TE.chain((settings) =>
            sendMessage({
              type: ConfigUpdate.value,
              payload: {
                ...settings,
                channelCreatorId: channelId,
              },
            })
          )
        )
      )
    ),
  {
    creatorVideos,
    ccRelatedUsers,
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
    accountSettings,
    videoRecommendations,
  }
);

export const updateSettings = command(
  (payload: AccountSettings) =>
    sendMessage({ type: ConfigUpdate.value, payload: payload }),
  { accountSettings, creatorRecommendations, creatorVideos }
);

export const verifyChannel = command(
  ({ channelId }: { channelId: string }) =>
    HTTPClient.post(`/v3/creator/${channelId}/verify`),
  {
    creator: Queries.creator.GetCreator,
  }
);
