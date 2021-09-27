import { available, compose, param, product, queryStrict } from 'avenger';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AccountSettings } from 'models/AccountSettings';
import { LocalLookup } from 'models/MessageRequest';
import { catchRuntimeLastError } from '../../../providers/browser.provider';
import { bo } from '../../../utils/browser.utils';
import { fetchTE } from './HTTPAPI';

export const CREATOR_CHANNEL_KEY = 'creator-channel';
export const CURRENT_VIDEO_ON_EDIT = 'current-video-on-edit';

export const accountSettings = queryStrict(() => {
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
    TE.map((result) => {
      console.log(result);
      return result;
    }),
    TE.chain(catchRuntimeLastError)
  );
}, available);

export const creatorRecommendations = compose(
  product({ accountSettings, params: param() }),
  queryStrict(
    ({ accountSettings, params }) =>
      fetchTE(
        `/v3/creator/recommendations/${accountSettings.publicKey}`,
        params
      ),
    available
  )
);

export const creatorVideos = compose(
  accountSettings,
  queryStrict((settings) => {
    if (settings.channelCreatorId !== undefined) {
      return fetchTE(`/v1/creator/videos/${settings.channelCreatorId}`);
    }
    return TE.right([]);
  }, available)
);

export const recommendedChannels = compose(
  product({ accountSettings, params: param() }),
  queryStrict(({ accountSettings, params }) => {
    if (accountSettings.channelCreatorId !== undefined) {
      return fetchTE(
        `/v1/profile/recommendations/${accountSettings.channelCreatorId}`,
        params
      );
    }
    return TE.right([]);
  }, available)
);

export const currentVideoRecommendations = compose(
  accountSettings,
  queryStrict((settings) => {
    if (settings?.edit.currentVideoId !== undefined) {
      return fetchTE(
        `/v1/video/${settings.edit.currentVideoId}/recommendations`
      );
    }
    return TE.right([]);
  }, available)
);
