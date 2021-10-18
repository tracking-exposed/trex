import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { Keypair } from 'models/Settings';
import { zencode_exec } from 'zenroom';

const conf = 'memmanager=lw';

export const makePublicKey = (knownAs: string): TE.TaskEither<chrome.runtime.LastError, Keypair> => {
    const contract = `Scenario 'ecdh': Create the keypair
    Given that I am known as '${knownAs}'
    When I create the keypair
    Then print my data`
    return pipe(
        TE.tryCatch(() => zencode_exec(contract, { conf }), E.toError),
        TE.map((r) => {
            console.log(r);
            return r.result as any
        })
      );
}

export const encrypt = (
  message: string,
  password: string
): TE.TaskEither<Error, string> => {
  const keys = JSON.stringify({ password });
  const data = JSON.stringify({ message });
  const contract = `Scenario 'ecdh': Encrypt a message with a password/secret
      Given that I have a 'string' named 'password'
      and that I have a 'string' named 'message'
      When I encrypt the secret message 'message' with 'password'
      Then print the 'secret message'`;

  return pipe(
    TE.tryCatch(() => zencode_exec(contract, { data, keys, conf }), E.toError),
    TE.map((r) => {
        console.log(r);
        return r.result
    })
  );
};
