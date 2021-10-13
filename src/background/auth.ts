import { AuthResponse } from '@backend/models/Auth';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { BackgroundAuthResponse } from 'models/MessageResponse';
import db from './db';

export function get(): TE.TaskEither<
  chrome.runtime.LastError,
  BackgroundAuthResponse
> {
  return pipe(
    db.get<AuthResponse>('auth'),
    TE.map((response) => ({ type: 'auth', response }))
  );
}

export function update(
  payload: AuthResponse | undefined
): TE.TaskEither<chrome.runtime.LastError, BackgroundAuthResponse> {
  return pipe(
    db.update<AuthResponse>('auth', payload),
    TE.map((auth) => ({ type: 'auth', response: auth }))
  );
}

export const auth = { get, update };
