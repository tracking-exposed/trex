import * as Endpoints from '@shared/endpoints';
import { Recommendation } from '@shared/models/Recommendation';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import { getDefaultSettings, Settings } from '../models/Settings';
import { sendAPIMessage, sendMessage } from '../providers/browser.provider';

export const settingsRefetch = queryShallow(() => {
  return pipe(
    sendMessage(Messages.GetSettings)(),
    TE.chain((s): TE.TaskEither<chrome.runtime.LastError, Settings> => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          sendMessage(Messages.UpdateSettings)(defaultSettings),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, refetch);

export const settings = queryShallow(() => {
  return pipe(
    sendMessage(Messages.GetSettings)(),
    TE.chain((s): TE.TaskEither<chrome.runtime.LastError, Settings> => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          sendMessage(Messages.UpdateSettings)(defaultSettings),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, available);

export const keypair = queryStrict(() => {
  return sendMessage(Messages.GetKeypair)();
}, refetch);

// public

export const videoRecommendations = queryShallow(
  ({
    videoId,
  }: {
    videoId: string;
  }): TE.TaskEither<chrome.runtime.LastError, Recommendation[]> =>
    sendAPIMessage(Endpoints.v3.Public.VideoRecommendations)({
      Params: { videoId },
    }),
  available
);
