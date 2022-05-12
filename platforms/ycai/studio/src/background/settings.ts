import * as constants from '@shared/constants';
import { toBrowserError } from '@shared/providers/browser.provider';
import bs58Provider from '@shared/providers/bs58.provider';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { Messages } from '../providers/browser.provider';
import db from './db';

export function generatePublicKeypair(
  passphrase: string
): TE.TaskEither<
  chrome.runtime.LastError,
  Messages['GenerateKeypair']['Response']
> {
  return pipe(
    bs58Provider.makeKeypair(passphrase),
    TE.mapLeft(toBrowserError),
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
