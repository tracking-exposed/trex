import { available, compose, param, product, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { LocalLookup } from 'models/MessageRequest';
import { bo } from '../../../utils/browser.utils';
import { getItem, getPersistentItem } from '../storage/Store';
import { fetchTE } from './HTTPAPI';
import { catchRuntimeLastError } from '../../../providers/browser.provider';
import { AccountSettings } from 'models/AccountSettings';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

export const localLookup = queryStrict(() => {
  return pipe(
    TE.tryCatch(
      () =>
        new Promise<AccountSettings>((resolve) => {
          bo.runtime.sendMessage<any, AccountSettings>(
            { type: LocalLookup.value },
            resolve
          );
        }),
      E.toError
    ),
    TE.chain(catchRuntimeLastError)
  );
}, available);

export const creatorChannel = queryStrict(
  () =>
    pipe(
      getItem<string>(CREATOR_CHANNEL_KEY),
      TE.chain((channel) => {
        return pipe(
          channel,
          O.fold(() => getPersistentItem(CREATOR_CHANNEL_KEY), TE.right)
        );
      })
    ),
  available
);

export const creatorRecommendations = compose(
  product({ localLookup, params: param() }),
  queryStrict(
    ({ localLookup, params }) =>
      fetchTE(`/v3/creator/recommendations/${localLookup.publicKey}`, params),
    available
  )
);

export const creatorVideos = compose(
  creatorChannel,
  queryStrict((channel) => {
    if (channel !== undefined) {
      return fetchTE(`/v1/creator/videos/${channel}`);
    }
    return TE.right([]);
  }, available)
);

export const recommendedChannels = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel, params }) => {
    if (creatorChannel !== undefined) {
      return fetchTE(`/v1/profile/recommendations/${creatorChannel}`, params);
    }
    return TE.right([]);
  }, available)
);

export const currentVideoOnEdit = queryStrict(() => {
  return pipe(
    getItem(CURRENT_VIDEO_ON_EDIT),
    TE.map((item): { videoId: string } | undefined =>
      typeof item === 'string' ? JSON.parse(item) : item
    )
  );
}, available);

export const currentVideoRecommendations = compose(
  currentVideoOnEdit,
  queryStrict((video) => {
    if (video?.videoId !== undefined) {
      return fetchTE(`/v1/video/${video.videoId}/recommendations`);
    }
    return TE.right([]);
  }, available)
);
