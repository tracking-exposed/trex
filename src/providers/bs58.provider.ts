import * as bs58 from 'bs58';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as nacl from 'tweetnacl';
import { Keypair } from '../models/Settings';
import { bkgLogger } from '../utils/logger.utils';
import { SecurityProvider } from './security.provider.type';
import { formatISO } from 'date-fns';

const makeKeypair = (
  passphrase: string
): TE.TaskEither<chrome.runtime.LastError, Keypair> => {

  const newKeypair = nacl.sign.keyPair();
  bkgLogger.debug('Keypair created %O with passphrase %s', newKeypair, passphrase);
  const keypair = {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
  bkgLogger.debug('Encoded keypair %O', keypair);
  return TE.right(keypair);
};

const makeToken = (
  date: Date,
  secretKey: string
): TE.TaskEither<chrome.runtime.LastError, string> => {
  const payload = pipe(
    [{ date: formatISO(date, { representation: 'date' }) }],
    Array.from,
    Uint8Array.from
  );

  return TE.right(nacl.sign(payload, bs58.decode(secretKey)).toString());
};

export const security: SecurityProvider = { makeKeypair, makeToken };
