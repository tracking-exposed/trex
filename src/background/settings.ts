import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { BackgroundSettingsResponse } from '../models/MessageResponse';
import { Keypair, Settings } from '../models/Settings';
import { makePublicKey } from '../providers/security.provider';
import db from './db';

export const SETTINGS_NAMESPACE = 'local';
export const PUBLIC_PAIRKEY = 'public-pairkey';

export function get(): TE.TaskEither<
  chrome.runtime.LastError,
  BackgroundSettingsResponse
> {
  return pipe(
    db.get<Settings>(SETTINGS_NAMESPACE),
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
export function generatePublicKey(): TE.TaskEither<
  chrome.runtime.LastError,
  Keypair
> {
  return pipe(
    db.get(PUBLIC_PAIRKEY),
    TE.chain(() => makePublicKey('')),
    TE.chain((pairkey) => db.set(PUBLIC_PAIRKEY, pairkey))
  );
}

export function update(
  payload: Settings | undefined
): TE.TaskEither<chrome.runtime.LastError, BackgroundSettingsResponse> {
  return pipe(
    db.update(SETTINGS_NAMESPACE, payload),
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
