// import db from '@chrome/db';
import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import { AccountSettings } from 'models/AccountSettings';
import { ConfigUpdate } from 'models/MessageRequest';
import { sendMessage } from '../../../providers/browser.provider';
import { fetchTE } from './HTTPAPI';
import { accountSettings, creatorRecommendations } from './queries';

export const addRecommendation = command(
  (r) =>
    fetchTE(`/creator/ogp`, {
      // TODO this api need also to be signed/authenticated
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: r }),
    }),
  {
    creatorRecommendations,
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, creatorId, recommendations }) => {
    return pipe(
      fetchTE(`/creator/updateVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          videoId,
          recommendations,
        }),
      })
    );
  },
  {
    accountSettings,
  }
);

export const updateSettings = command(
  (payload: AccountSettings) =>
    sendMessage({ type: ConfigUpdate.value, payload: payload }),
  { accountSettings }
);
