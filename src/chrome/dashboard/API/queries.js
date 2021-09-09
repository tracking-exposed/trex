import {
  available,
  queryStrict,
  refetch,
  compose,
  product,
  param,
} from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import { getItem } from '../storage/Store';
import { fetch } from './HTTPAPI';
import * as TE from 'fp-ts/lib/TaskEither';

export const creatorChannel = queryStrict(
  () =>
    pipe(
      getItem('creator-channel'),
      TE.map((channel) => ({ publicKey: channel }))
    ),
  available
);

export const recommendations = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel, params }) => {
    return fetch(
      `/creator/recommendations/${creatorChannel.publicKey}`,
      params
    );
  }, available)
);

export const creatorVideos = compose(
  creatorChannel,
  queryStrict(({ publicKey }) => {
    // url (videoId)
    // thumbnail
    // title
    // publication date
    // recommendations: number
    return fetch(`/creator/videos/${publicKey}`);
  }, available)
);

export const recommendedVideos = compose(
  creatorChannel,
  queryStrict(({ publicKey, params }) => {
    return fetch(`/creator/recommendations/${publicKey}`, params);
  }, available)
);

export const recommendedChannels = compose(
  creatorChannel,
  queryStrict(({ publicKey, params }) => {
    return fetch(`/profile/recommendations/${publicKey}`, params);
  }, available)
);

export const currentVideoOnEdit = queryStrict(() => {
  return pipe(
    getItem('current-video-on-edit'),
    TE.map((item) => {
      console.log({ item });
      return item ? JSON.parse(item) : item;
    })
  );
}, available);

// export const videoRecommendations = queryStrict(({ videoId }) => {
//   return fetch(`/video/${videoId}/recommendations`);
// }, available);

export const currentVideoRecommendations = compose(
  currentVideoOnEdit,
  queryStrict((video) => {
    if (video) {
      return fetch(`/video/${video.videoId}/recommendations`);
    }
    return TE.right([]);
  }, available)
);
