import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError } from '@shared/errors/AppError';
import { getDefaultSettings } from '../../models/Settings';
import * as localStorage from '@shared/providers/localStorage.provider';
import * as sharedConstants from '@shared/constants';
import { Keypair } from '@shared/models/extension/Keypair';
import { MakeAPIClient } from '@shared/providers/api.provider';
import { config } from '../../config';
import * as endpoints from '@yttrex/shared/endpoints';

export const { API, HTTPClient } = MakeAPIClient(
  {
    baseURL: config.API_URL,
    getAuth: async (req) => req,
    onUnauthorized: async (res) => res,
  },
  endpoints
);

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
      Query: {
        channelId: undefined,
      },
    }),
  available
);
