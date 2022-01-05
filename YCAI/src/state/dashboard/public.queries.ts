import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError } from '../../../../shared/src/errors/AppError';
import { getDefaultSettings, Keypair } from '../../models/Settings';
import { API } from '../../api';
import * as localStorage from '@shared/providers/localStorage.provider';
import * as sharedConstants from '@shared/constants';

export const settingsRefetch = queryShallow(() => {
  return pipe(
    TE.fromIO<any, AppError>(
      localStorage.getItem(sharedConstants.SETTINGS_KEY)
    ),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          TE.fromIO(
            localStorage.setItem(sharedConstants.SETTINGS_KEY, defaultSettings)
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
    TE.fromIO<any, AppError>(
      localStorage.getItem(sharedConstants.SETTINGS_KEY)
    ),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          TE.fromIO(
            localStorage.setItem(sharedConstants.SETTINGS_KEY, defaultSettings)
          ),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, available);

// todo:
export const keypair = queryStrict<any, AppError, Keypair | null>(() => {
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
