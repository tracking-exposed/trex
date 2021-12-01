import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../models/Messages';
import security from '../providers/bs58.provider';
import db from './db';
import * as constants from '../constants'

export function generatePublicKeypair(
  passphrase: string
): TE.TaskEither<
  chrome.runtime.LastError,
  Messages['GenerateKeypair']['Response']
> {
  return pipe(
    security.makeKeypair(passphrase),
    TE.chain((keypair) => db.set(constants.PUBLIC_KEYPAIR, keypair)),
    TE.map((response) => ({
      type: Messages.GenerateKeypair.Response.type,
      response,
    }))
  );
}

export function deletePublicKeypair(): TE.TaskEither<
  chrome.runtime.LastError,
  Messages['DeleteKeypair']['Response']
> {
  return pipe(
    db.set(constants.PUBLIC_KEYPAIR, null),
    TE.map(() => ({
      type: Messages.DeleteKeypair.Response.type,
      response: undefined,
    }))
  );
}
