import * as TE from 'fp-ts/lib/TaskEither';
import { Keypair } from 'models/Settings';
import * as E from 'fp-ts/lib/Either';

export interface SecurityProvider {
  makeKeypair: (
    passphrase: string
  ) => TE.TaskEither<chrome.runtime.LastError, Keypair>;
  makeToken: (
    date: Date,
    secretKey: string
  ) => TE.TaskEither<chrome.runtime.LastError, string>;
  makeSignature: (
    payload: any,
    secretKey: string
  ) => E.Either<chrome.runtime.LastError, string>;
}
