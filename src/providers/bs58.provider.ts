import * as bs58 from 'bs58';
import * as TE from 'fp-ts/lib/TaskEither';
import * as nacl from 'tweetnacl';
import { Keypair } from '../models/Settings';
import { bkgLogger } from '../utils/logger.utils';
import { SecurityProvider } from './security.provider.type';

const makeKeypair = (
  knownAs: string
): TE.TaskEither<chrome.runtime.LastError, Keypair> => {
  // const secretKeyUint8Array = Uint8Array.from(
  //   Array.from(knownAs).map((letter) => letter.charCodeAt(0))
  // );


  const newKeypair = nacl.sign.keyPair();
  bkgLogger.debug('Keypair created %O', newKeypair);
  const pairkey = {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
  bkgLogger.debug('Encoded keypair %O', pairkey);
  return TE.right(pairkey);
};

export const security: SecurityProvider = { makeKeypair };
