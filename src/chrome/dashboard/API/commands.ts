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
  creatorRecommendations,
  CREATOR_CHANNEL_KEY,
} from './queries';
import { sendMessage } from '../../../providers/browser.provider';

export const setCreatorChannel = command(
  (channel: string) => setItem(CREATOR_CHANNEL_KEY, channel),
  {
    creatorChannel,
  }
);

export const saveCreatorChannel = command(
  (channel: string) =>
    TE.sequenceSeqArray([
      setItem(CREATOR_CHANNEL_KEY, channel),
      setPersistentItem(CREATOR_CHANNEL_KEY, channel),
    ]),
  {
    creatorRecommendations,
    currentVideoOnEdit,
  }
);

export const deleteCreatorChannel = command(
  () => removePersistenItem('creator-channel'),
  {
    creatorRecommendations,
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
    creatorRecommendations,
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
