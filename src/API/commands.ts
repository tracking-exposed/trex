import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import { AccountSettings } from 'models/AccountSettings';
import { ConfigUpdate } from 'models/MessageRequest';
import { sendMessage } from '../providers/browser.provider';
import { fetchTE } from './HTTPAPI';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  accountSettings,
  creatorRecommendations,
  creatorVideos,
} from './queries';

export const registerCreatorChannel = command(
  (channelId: string) =>
    pipe(
      fetchTE(`/v3/creator/register/${channelId}`),
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
  }
);

export const addRecommendation = command(
  ({ url }: { url: string }) =>
    fetchTE(`/v3/creator/ogp`, {
      // TODO this api need also to be signed/authenticated
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    }),
  {
    creatorRecommendations,
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, creatorId, recommendations }) => {
    return pipe(
      fetchTE(`/v3/creator/updateVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          videoId,
          recommendations,
        }),
      }),
      TE.chain(() =>
        pipe(
          accountSettings.run(),
          TE.chain((settings) =>
            sendMessage({
              type: ConfigUpdate.value,
              payload: {
                ...settings,
                edit: {
                  ...settings.edit,
                  recommendations,
                },
              },
            })
          )
        )
      )
    );
  },
  {
    accountSettings,
  }
);

export const updateSettings = command(
  (payload: AccountSettings) =>
    sendMessage({ type: ConfigUpdate.value, payload: payload }),
  { accountSettings, creatorRecommendations, creatorVideos }
);
