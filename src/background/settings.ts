import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  BackgroundKeypairResponse,
  BackgroundSettingsResponse
} from '../models/MessageResponse';
import { Keypair, Settings } from '../models/Settings';
import { security } from '../providers/bs58.provider';
import db from './db';

export const SETTINGS_NAMESPACE = 'local';
export const PUBLIC_PAIRKEY = 'public-pairkey';

export function get(): TE.TaskEither<
  chrome.runtime.LastError,
  BackgroundSettingsResponse
> {
  return pipe(
    db.get<Settings>(SETTINGS_NAMESPACE),
    TE.map((response) => ({ type: 'settings', response }))
  );
}

export function getKeypair(): TE.TaskEither<
  chrome.runtime.LastError,
  BackgroundKeypairResponse
> {
  return pipe(
    db.get<Keypair>(PUBLIC_PAIRKEY),
    TE.map((response) => ({ type: 'keypair', response }))
  );
}

export function generatePublicKeypair(
  secretKey: string
): TE.TaskEither<chrome.runtime.LastError, Keypair> {
  return pipe(
    security.makeKeypair(secretKey),
    TE.chain((pairkey) => db.set(PUBLIC_PAIRKEY, pairkey))
  );
}

export function update(
  payload: Settings | undefined
): TE.TaskEither<chrome.runtime.LastError, BackgroundSettingsResponse> {
  return pipe(
    db.update(SETTINGS_NAMESPACE, payload),
    TE.chain((r) =>
      TE.fromEither(
        pipe(
          Settings.decode(r),
          E.mapLeft((e) => e as any as chrome.runtime.LastError)
        )
      )
    ),
    TE.map((response) => ({ type: 'settings', response }))
  );
}
