import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { Keypair } from '../models/Settings';
import { GetLogger } from '../utils/logger.utils';
import { toBrowserError } from './browser.provider';
import { zencode_exec } from 'zenroom';
import { SecurityProvider } from './security.provider.type';

const conf = '';

const zrLogger = GetLogger('zenroom');

export const makeKeypair = (
  knownAs: string
): TE.TaskEither<chrome.runtime.LastError, Keypair> => {
  const data = JSON.stringify({ knownAs });
  const contract = `
Scenario 'ecdh': Create the keypair from a name passed from data/keys
Given my name is in a 'string' named 'knownAs'
When I create the keypair
Then print my data`;

  zrLogger.debug(`Contract %s %O`, contract, { data, conf });
  return pipe(
    TE.tryCatch(
      () =>
        zencode_exec(contract, {
          data,
          keys: null,
          conf,
        }),
      toBrowserError
    ),
    TE.map((r) => {
      const result = JSON.parse(r.result);
      zrLogger.debug(`zencode result %O`, result);
      return {
        publicKey: result[knownAs].keypair.public_key,
        secretKey: result[knownAs].keypair.private_key,
      };
    })
  );
};

const makeToken = (
  date: Date,
  secretKey: string
): TE.TaskEither<Error, string> => {
  const keys = JSON.stringify({ secretKey });
  const data = JSON.stringify({ date });
  const contract = `Scenario 'ecdh': Encrypt a message with a password/secret
      Given that I have a 'string' named 'password'
      and that I have a 'string' named 'message'
      When I encrypt the secret message 'message' with 'password'
      Then print the 'secret message'`;

  return pipe(
    TE.tryCatch(() => zencode_exec(contract, { data, keys, conf }), E.toError),
    TE.map((r) => {
      zrLogger.debug(`Make token result: %O`, r);
      return r.result;
    })
  );
};

export const security: SecurityProvider = {
  makeKeypair,
  makeToken,
  makeSignature: () => E.left({ message: 'Not implemented ' }),
};
