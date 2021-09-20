import { available, compose, param, product, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { LocalLookup } from 'models/MessageRequest';
import { bo } from 'utils/browser.utils';
import { getItem, getPersistentItem } from '../storage/Store';
import { fetchTE } from './HTTPAPI';
import { catchRuntimeLastError } from '@chrome/db';
import { AccountSettings } from 'models/AccountSettings';

export const creatorChannel = queryStrict(
  () =>
    pipe(
      getItem<string>('creator-channel'),
      TE.chain((channel) => {
        if (channel === undefined) {
          return pipe(
            getPersistentItem('creator-channel'),
            TE.chain((item) =>
              item === null
                ? TE.left(new Error('Creator Channel is missing!'))
                : TE.right(item)
            )
          );
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
    if (creatorChannel.publicKey !== null) {
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
    if (publicKey !== null) {
      return fetchTE(`/creator/videos/${publicKey}`);
    }
    return TE.right([]);
  }, available)
);

export const recommendedVideos = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel: { publicKey }, params }) => {
    return fetchTE(`/creator/recommendations/${publicKey}`, params);
  }, available)
);

export const recommendedChannels = compose(
  product({ creatorChannel, params: param() }),
  queryStrict(({ creatorChannel: { publicKey }, params }) => {
    return fetchTE(`/profile/recommendations/${publicKey}`, params);
  }, available)
);

export const currentVideoOnEdit = queryStrict(() => {
  return pipe(
    getItem('current-video-on-edit'),
    TE.map((item): { videoId: string } | undefined =>
      typeof item === 'string' ? JSON.parse(item) : item
    )
  );
}, available);

export const currentVideoRecommendations = compose(
  currentVideoOnEdit,
  queryStrict((video) => {
    if (video !== undefined) {
      return fetchTE(`/video/${video.videoId}/recommendations`);
    }
    return TE.right([]);
  }, available)
);

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
    TE.chain(catchRuntimeLastError),
    TE.chain((settings) => {
      if (settings?.publicKey !== undefined) {
        return TE.right(settings);
      }
      return TE.left(new Error('Public key is missing'));
    })
  );
}, available);
