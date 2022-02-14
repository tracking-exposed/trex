import * as Endpoints from '@shared/endpoints';
import { browser, Messages } from '../providers/browser.provider';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { getDefaultSettings } from '../models/Settings';

export const settingsRefetch = queryShallow(() => {
  return pipe(
    browser.sendMessage(Messages.GetSettings)(),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          browser.sendMessage(Messages.UpdateSettings)(defaultSettings),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, refetch);

export const settings = queryShallow(() => {
  return pipe(
    browser.sendMessage(Messages.GetSettings)(),
    TE.chain((s) => {
      if (s === null) {
        const defaultSettings = getDefaultSettings();
        return pipe(
          browser.sendMessage(Messages.UpdateSettings)(defaultSettings),
          TE.map(() => defaultSettings)
        );
      }
      return TE.right(s);
    })
  );
}, available);

export const videoRecommendations = queryShallow(
  ({ channelId, videoId }: { channelId?: string; videoId: string }) =>
    browser.sendAPIMessage(Endpoints.v3.Public.VideoRecommendations)({
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
  return browser.sendMessage(Messages.GetKeypair)();
}, refetch);
