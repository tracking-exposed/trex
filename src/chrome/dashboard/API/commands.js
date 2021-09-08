import { command } from 'avenger';
import {
  recommendations,
  currentVideoOnEdit,
  videoRecommendations
} from './queries';
import { fetch } from './HTTPAPI';
import { setItem } from '../storage/Store';

export const setCreatorChannel = command(
  (channel) => setItem('creator-channel', channel),
  {
    recommendations,
    currentVideoOnEdit
  }
);

export const addRecommendation = command((r) => fetch(`/creator/ogp/${r}`), {
  recommendations
});

export const setCurrentVideo = command(
  (video) => setItem('current-video-on-edit', JSON.stringify(video)),
  {
    currentVideoOnEdit
  }
);

export const updateRecommendationForVideo = command(
  ({ videoId, recommendations }) =>
    fetch(`/creator/updateVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creatorId: 'uno',
        videoId,
        recommendations
      })
    }),
  {
    videoRecommendations
  }
);
