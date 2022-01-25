import * as bs58 from 'bs58';
import { formatISO } from 'date-fns';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import nacl from 'tweetnacl';
import { Keypair } from '../models/Settings';
import { logger } from '../utils/logger.utils';
import { catchRuntimeLastError } from './browser.provider';
import { SecurityProvider } from './security.provider.type';

const bs58Logger = logger.extend('bs58');

function decodeString(s: string): Uint8Array {
  // Credits: https://github.com/dchest/tweetnacl-util-js
  const d = unescape(encodeURIComponent(s));
  const b = new Uint8Array(d.length);

  for (let i = 0; i < d.length; i++) {
    b[i] = d.charCodeAt(i);
  }
  return b;
}

function decodeKey(key: string): Uint8Array {
  return new Uint8Array(bs58.decode(key));
}

const makeKeypair = (
  passphrase: string
): TE.TaskEither<chrome.runtime.LastError, Keypair> => {
  const newKeypair = nacl.sign.keyPair();
  bs58Logger.debug(
    'Keypair created %O with passphrase %s',
    newKeypair,
    passphrase
  );
  const keypair = {
    publicKey: bs58.encode(newKeypair.publicKey),
    secretKey: bs58.encode(newKeypair.secretKey),
  };
  bs58Logger.debug('Encoded keypair %O', keypair);
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

const makeSignature = (
  payload: any,
  secretKey: string
): E.Either<chrome.runtime.LastError, string> => {
  const signature = nacl.sign.detached(
    decodeString(JSON.stringify(payload)),
    decodeKey(secretKey)
  );
  return catchRuntimeLastError(bs58.encode(signature));
};

const security: SecurityProvider = {
  makeKeypair,
  makeToken,
  makeSignature,
};

export default security;
