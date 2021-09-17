import { available, compose, param, product, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { getItem, getPersistentItem } from '../storage/Store';
import { fetchTE } from './HTTPAPI';

export const creatorChannel = queryStrict(
  () =>
    pipe(
      getItem('creator-channel'),
      TE.chain((channel) => {
        if (!channel) {
          return getPersistentItem('creator-channel');
        }
        return TE.right(channel);
      }),
      TE.map((channel) => ({ publicKey: channel }))
    ),
  available
);

export const recommendations = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel, params }) => {
    if (creatorChannel.publicKey) {
      return fetchTE(
        `/creator/recommendations/${creatorChannel.publicKey}`,
        params
      );
    }
    return TE.right([]);
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
    if (publicKey) {
      return fetchTE(`/creator/videos/${publicKey}`);
    }
    return TE.right([]);
  }, available)
);

export const recommendedVideos = compose(
  creatorChannel,
  queryStrict(({ publicKey, params }) => {
    return fetchTE(`/creator/recommendations/${publicKey}`, params);
  }, available)
);

export const recommendedChannels = compose(
  creatorChannel,
  queryStrict(({ publicKey, params }) => {
    return fetchTE(`/profile/recommendations/${publicKey}`, params);
  }, available)
);

export const currentVideoOnEdit = queryStrict(() => {
  return pipe(
    getItem('current-video-on-edit'),
    TE.map((item) => (item ? JSON.parse(item) : item))
  );
}, available);

export const currentVideoRecommendations = compose(
  currentVideoOnEdit,
  queryStrict((video) => {
    if (video) {
      return fetchTE(`/video/${video.videoId}/recommendations`);
    }
    return TE.right([]);
  }, available)
);
