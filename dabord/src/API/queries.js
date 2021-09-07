import {
  available,
  queryStrict,
  refetch,
  compose,
  product,
  param,
} from "avenger";
import { pipe } from "fp-ts/lib/function";
import { getItem } from "../storage/Store";
import { fetch } from "./HTTPAPI";
import * as TE from "fp-ts/lib/TaskEither";

export const creatorChannel = queryStrict(
  () =>
    pipe(
      getItem("creator-channel"),
      TE.map((channel) => ({ publicKey: channel }))
    ),
  available
);

export const recommendations = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel, params }) => {
    return fetch(`/creator/recommendations/${creatorChannel.publicKey}`, params);
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
  }, refetch)
);

export const recommendedChannels = compose(
  creatorChannel,
  queryStrict(({ publicKey, params }) => {
    return fetch(`/profile/recommendations/${publicKey}`, params);
  }, refetch)
);

export const currentVideoOnEdit = queryStrict(() => {
  return pipe(
    getItem("current-video-on-edit"),
    TE.map((item) => JSON.parse(item))
  );
}, available);

export const videoRecommendations = compose(
  product({ currentVideoOnEdit, params: param() }),
  queryStrict(({ currentVideoOnEdit }) => {
    return fetch(`/video/${currentVideoOnEdit.videoId}/recommendations`);
  }, available)
);
