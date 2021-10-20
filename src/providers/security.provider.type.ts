import * as TE from 'fp-ts/lib/TaskEither';
import { Keypair } from 'models/Settings';


export interface SecurityProvider {
  makeKeypair: (secretKey: string) => TE.TaskEither<chrome.runtime.LastError, Keypair>
}
