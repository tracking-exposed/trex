import bs58 from 'bs58';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import nacl from 'tweetnacl';
import { Settings } from '../models/AccountSettings';
import { BackgroundSettingsResponse } from '../models/MessageResponse';
import db from './db';
import { bkgLogger } from '../utils/logger.utils';



export const SETTINGS_NAMESPACE = 'local';

function initializeKey(): Pick<Settings, 'publicKey' | 'secretKey'> {
  const newKeypair = nacl.sign.keyPair();
  // eslint-disable-next-line no-console
  bkgLogger.debug('No keys found, initializing...')
  return {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
}

// defaults of the settings stored in 'config' and controlled by popup
const getDefaultSettings = (): Settings => ({
  active: true,
  ccRecommendations: true,
  svg: false,
  videorep: true,
  playhide: false,
  ux: false,
  communityRecommendations: false,
  alphabeth: false,
  stats: false,
  channelCreatorId: null,
  edit: null,
  ...initializeKey(),
});

export function userLookup(): TE.TaskEither<
  chrome.runtime.LastError,
  BackgroundSettingsResponse
> {
  return pipe(
    db.get<Settings>(SETTINGS_NAMESPACE),
    TE.chain((val) => {
      if (val === undefined || Object.keys(val).length === 0) {
        return db.set(SETTINGS_NAMESPACE, getDefaultSettings());
      }
      return TE.right(val);
    }),
    TE.map((response) => ({ type: 'settings', response }))
  );
}
// export function serverLookup<A>(
//   payload: A
// ): TE.TaskEither<chrome.runtime.LastError, ServerLookupResponse> {
//   /* remoteLookup might be call as first function after the extension has been
//    * installed, and the keys not be yet instanciated */

//   return pipe(
//     userLookup(),
//     TE.chain(() =>
//       pipe(
//         TE.tryCatch(() => api.handshake(payload, SETTINGS_NAMESPACE), E.toError),
//         TE.fold(
//           (e) =>
//             T.of(
//               E.right<chrome.runtime.LastError, ServerLookupResponse>({
//                 type: 'handshakeError',
//                 response: e,
//               })
//             ),
//           (r) =>
//             T.of(
//               E.right<chrome.runtime.LastError, ServerLookupResponse>({
//                 type: 'handshakeResponse',
//                 response: r,
//               })
//             )
//         ),
//         TE.chain(catchRuntimeLastError)
//       )
//     )
//   );
// }

export function update(
  payload: Settings | undefined
): TE.TaskEither<chrome.runtime.LastError, BackgroundSettingsResponse> {
  const userId = SETTINGS_NAMESPACE;
  return pipe(
    db.update(userId, payload),
    TE.chain((r) =>
      TE.fromEither(
        pipe(
          Settings.decode(r),
          E.mapLeft((e) => e as any as chrome.runtime.LastError)
        )
      )
    ),
    TE.map((response) => ({ type: 'settings', response }))
  );
}
