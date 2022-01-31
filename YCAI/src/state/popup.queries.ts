import * as Endpoints from '@shared/endpoints';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import { getDefaultSettings } from '../models/Settings';
import { sendAPIMessage, sendMessage } from '../providers/browser.provider';

export const settingsRefetch = queryShallow(() => {
  return pipe(
    sendMessage(Messages.GetSettings)(),
    TE.chain((s) => {
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
    TE.chain((s) => {
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

export const videoRecommendations = queryShallow(
  ({ channelId, videoId }: { channelId?: string; videoId: string }) =>
    sendAPIMessage(Endpoints.v3.Public.VideoRecommendations)({
      Params: {
        videoId,
      },
      Query: {
        channelId,
      },
    }),
  available
);

export const keypair = queryStrict(() => {
  return sendMessage(Messages.GetKeypair)();
}, refetch);
