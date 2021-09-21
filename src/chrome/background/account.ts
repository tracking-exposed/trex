import bs58 from 'bs58';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { ServerLookupResponse } from 'models/MessageResponse';
import { catchRuntimeLastError } from 'providers/browser.provider';
import nacl from 'tweetnacl';
import { AccountSettings } from '../../models/AccountSettings';
import api from '../api';
import db from '../db';

export const DEFAULT_USER_NAME = 'local';

function initializeKey(): Pick<AccountSettings, 'publicKey' | 'secretKey'> {
  const newKeypair = nacl.sign.keyPair();
  // eslint-disable-next-line no-console
  console.log('Initializing new key pair:', bs58.encode(newKeypair.publicKey));
  return {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
}

// defaults of the settings stored in 'config' and controlled by popup
const getDefaultSettings = (): AccountSettings => ({
  active: true,
  ccRecommendations: true,
  svg: false,
  videorep: true,
  playhide: false,
  ux: false,
  communityRecommendations: false,
  alphabeth: false,
  stats: false,
  ...initializeKey(),
});

export function userLookup({
  userId,
}: {
  userId: string;
}): TE.TaskEither<chrome.runtime.LastError, AccountSettings> {
  return pipe(
    db.get<AccountSettings>(userId),
    TE.chain((val) => {
      if (val === undefined || Object.keys(val).length === 0) {
        return db.set(userId, getDefaultSettings());
      }
      return TE.right(val);
    })
  );
}
export function serverLookup<A>(
  payload: A
): TE.TaskEither<chrome.runtime.LastError, ServerLookupResponse> {
  /* remoteLookup might be call as first function after the extension has been
   * installed, and the keys not be yet instanciated */
  const userId = DEFAULT_USER_NAME;
  return pipe(
    userLookup({ userId }),
    TE.chain(() =>
      pipe(
        TE.tryCatch(() => api.handshake(payload, DEFAULT_USER_NAME), E.toError),
        TE.fold(
          (e) =>
            T.of(
              E.right<chrome.runtime.LastError, ServerLookupResponse>({
                type: 'handshakeError',
                response: e,
              })
            ),
          (r) =>
            T.of(
              E.right<chrome.runtime.LastError, ServerLookupResponse>({
                type: 'handshakeResponse',
                response: r,
              })
            )
        ),
        TE.chain(catchRuntimeLastError)
      )
    )
  );
}

export function configUpdate<A extends object>(
  payload: A
): TE.TaskEither<chrome.runtime.LastError, A> {
  const userId = DEFAULT_USER_NAME;
  return db.update<A>(userId, payload);
}
