import { command } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  clearPersistentItem,
  setItem,
  setPersistentItem,
} from '../storage/Store';
import { fetch } from './HTTPAPI';
import {
  creatorChannel,
  currentVideoOnEdit,
  currentVideoRecommendations,
  recommendations,
} from './queries';

export const setCreatorChannel = command(
  (channel) => setItem('creator-channel', channel),
  {
    creatorChannel,
  }
);

export const saveCreatorChannel = command(
  (channel) => setPersistentItem('creator-channel', channel),
  {
    recommendations,
    currentVideoOnEdit,
  }
);

export const deleteCreatorChannel = command(
  (channel) => clearPersistentItem('creator-channel', channel),
  {
    recommendations,
    currentVideoOnEdit,
  }
);

export const addRecommendation = command((r) => 
fetch(`/creator/ogp`, { // TODO this api need also to be signed/authenticated
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: r })
}), {
  recommendations,
});

export const setCurrentVideo = command(
  (video) => setItem('current-video-on-edit', JSON.stringify(video)),
  {
    currentVideoOnEdit,
    currentVideoRecommendations,
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, creatorId, recommendations }) => {
    console.log('Updating video', { videoId, creatorId, recommendations });
    return pipe(
      fetch(`/creator/updateVideo`, {
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
