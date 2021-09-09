import { command } from 'avenger';
import {
  recommendations,
  currentVideoOnEdit,
  currentVideoRecommendations,
  creatorVideos,
} from './queries';
import { fetch } from './HTTPAPI';
import { setItem, setPersistentItem } from '../storage/Store';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

export const setCreatorChannel = command(
  (channel) => setPersistentItem('creator-channel', channel),
  {
    recommendations,
    currentVideoOnEdit,
  }
);

export const addRecommendation = command((r) => fetch(`/creator/ogp/${r}`), {
  recommendations,
});

export const setCurrentVideo = command(
  (video) => setItem('current-video-on-edit', JSON.stringify(video)),
  {
    currentVideoOnEdit,
    currentVideoRecommendations
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, recommendations }) => {
    console.log('Updating video', { videoId, recommendations });
    return pipe(
      fetch(`/creator/updateVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: 'uno',
          videoId,
          recommendations,
        }),
      }),
      TE.chainFirst((video) => setItem('current-video-on-edit', JSON.stringify(video)))
    );
  },
  {
    currentVideoOnEdit
  }
);
