import { Keypair } from '../models/extension/Keypair';
import * as TE from 'fp-ts/lib/TaskEither';

export interface SecurityProvider {
  makeKeypair: (passphrase: string) => TE.TaskEither<Error, Keypair>;
  makeToken: (date: Date, secretKey: string) => TE.TaskEither<Error, string>;
  makeSignature: (
    payload: any,
    secretKey: string
  ) => TE.TaskEither<Error, string>;
  verifySignature: (
    message: string,
    publicKey: string,
    signature: string
  ) => TE.TaskEither<Error, boolean>;
}
