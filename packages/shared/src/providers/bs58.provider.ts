import * as bs58 from 'bs58';
import { formatISO } from 'date-fns';
import { pipe } from 'fp-ts/lib/pipeable';
import nacl from 'tweetnacl';
import { trexLogger } from '../logger';
import { Keypair } from '../models/extension/Keypair';
import { SecurityProvider } from './security.provider.type';
import * as TE from 'fp-ts/lib/TaskEither';

const bs58Logger = trexLogger.extend('bs58');

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

const makeKeypair = (passphrase: string): TE.TaskEither<Error, Keypair> => {
  const newKeypair = nacl.sign.keyPair();
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
): TE.TaskEither<Error, string> => {
  const payload = pipe(
    [{ date: formatISO(date, { representation: 'date' }) }],
    Array.from,
    (mm) => Uint8Array.from(mm as number[])
  );

  return TE.right(nacl.sign(payload, bs58.decode(secretKey)).toString());
};

const makeSignature = (
  json: string,
  secretKey: string
): TE.TaskEither<Error, string> => {
  const signature = nacl.sign.detached(
    decodeString(json),
    decodeKey(secretKey)
  );
  return TE.right(bs58.encode(signature));
};

const verifySignature = (
  message: string,
  publicKey: string,
  signatureKey: string
): TE.TaskEither<Error, boolean> => {
  const verify = nacl.sign.detached.verify(
    decodeString(message),
    decodeKey(signatureKey),
    decodeKey(publicKey)
  );

  return TE.right(verify);
};

const bs58Provider: SecurityProvider = {
  makeKeypair,
  makeToken,
  makeSignature,
  verifySignature,
};

export default bs58Provider;
