import * as TE from 'fp-ts/lib/TaskEither';
import { Keypair } from 'models/Settings';


export interface SecurityProvider {
  makeKeypair: (passphrase: string) => TE.TaskEither<chrome.runtime.LastError, Keypair>,
  makeToken: (date: Date, secretKey: string) => TE.TaskEither<chrome.runtime.LastError, string>
}
