// import db from '@chrome/db';
import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AccountSettings } from 'models/AccountSettings';
import { ConfigUpdate } from 'models/MessageRequest';
import {
  removePersistenItem,
  setItem,
  setPersistentItem,
} from '../storage/Store';
import { fetchTE } from './HTTPAPI';
import {
  creatorChannel,
  currentVideoOnEdit,
  currentVideoRecommendations,
  localLookup,
  recommendations,
} from './queries';
import { sendMessage } from '../../../providers/browser.provider';

export const setCreatorChannel = command(
  (channel) => setItem('creator-channel', channel),
  {
    creatorChannel,
  }
);

export const saveCreatorChannel = command(
  (channel: string) => setPersistentItem('creator-channel', channel),
  {
    recommendations,
    currentVideoOnEdit,
  }
);

export const deleteCreatorChannel = command(
  () => removePersistenItem('creator-channel'),
  {
    recommendations,
    currentVideoOnEdit,
  }
);

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
    recommendations,
  }
);

export const setCurrentVideo = command(
  (video) => setItem('current-video-on-edit', JSON.stringify(video)),
  {
    currentVideoOnEdit,
    currentVideoRecommendations,
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
      }),
      TE.chainFirst((video) =>
        setItem('current-video-on-edit', JSON.stringify(video))
      )
    );
  },
  {
    currentVideoOnEdit,
  }
);

export const updateSettings = command(
  (payload: AccountSettings) =>
    sendMessage({ type: ConfigUpdate.value, payload: payload }),
  { localLookup }
);
