import * as Endpoints from '@shared/endpoints';
import { MakeAPIClient } from '@shared/providers/api.provider';
import { available, queryShallow, queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { config } from '../../config';
import { getDefaultSettings } from '../../models/Settings';
import { browser, Messages } from '../../providers/browser.provider';

/**
 * The popup api client doesn't need any specific authorization
 */
export const { API } = MakeAPIClient({
  baseURL: config.API_URL,
  getAuth: (req) =>
    pipe(
      browser.sendMessage(Messages.GetKeypair)(),
      TE.fold(
        (e) => () => Promise.resolve(req),
        (k) => async () => {
          // req.headers('X-YTtrex-Version', config.VERSION);
          // req.headers('X-YTtrex-Build', config.BUILD);
          // const signature = nacl.sign.detached(
          //   decodeString(payload),
          //   decodeKey(keypair.secretKey)
          // );
          // xhr.setRequestHeader('X-YTtrex-NonAuthCookieId', cookieId);
          // xhr.setRequestHeader('X-YTtrex-PublicKey', keypair.publicKey);
          // xhr.setRequestHeader('X-YTtrex-Signature', bs58.encode(signature));
          // req.headers = {
          //   ...req.headers,
          //   Authorization: `Bearer ${k.publicKey}`,
          // };
          return Promise.resolve(req);
        }
      )
    )(),
  onUnauthorized: async (res) => res,
}, Endpoints);

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

/**
 * Get keypair value by sending a message to the background script
 */
export const keypair = queryStrict(() => {
  return browser.sendMessage(Messages.GetKeypair)();
}, refetch);
