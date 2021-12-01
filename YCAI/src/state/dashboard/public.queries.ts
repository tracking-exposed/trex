import * as Endpoints from '@shared/endpoints';
import { Recommendation } from '@shared/models/Recommendation';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as localStorage from '../../providers/localStorage.provider';
import { Messages } from '../../models/Messages';
import { getDefaultSettings, Settings } from '../../models/Settings';
import { sendAPIMessage, sendMessage } from '../../providers/browser.provider';
import * as constants from '../../constants';
import { AppError } from 'models/errors/AppError';
import { API } from 'providers/api.provider';

export const settingsRefetch = queryShallow(() => {
  return pipe(
    TE.fromIO<any, AppError>(localStorage.getItem(constants.SETTINGS_KEY)),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          TE.fromIO(
            localStorage.setItem(constants.SETTINGS_KEY, defaultSettings)
          ),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, refetch);

export const settings = queryShallow(() => {
  return pipe(
    TE.fromIO<any, AppError>(localStorage.getItem(constants.SETTINGS_KEY)),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          TE.fromIO(
            localStorage.setItem(constants.SETTINGS_KEY, defaultSettings)
          ),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, available);

// todo:
export const keypair = queryStrict(() => {
  return TE.right(null);
}, refetch);

// public

export const videoRecommendations = queryShallow(
  ({ videoId }: { videoId: string }) =>
    API.v3.Public.VideoRecommendations({
      Params: { videoId },
    }),
  available
);
