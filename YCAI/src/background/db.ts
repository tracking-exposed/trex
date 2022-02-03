import { catchRuntimeLastError } from '@shared/providers/browser.provider';
import { bo } from '@shared/utils/browser.utils';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { getAssignSemigroup } from 'fp-ts/lib/struct';
import * as TE from 'fp-ts/lib/TaskEither';
import { logger } from 'utils/logger.utils';

const dbLogger = logger.extend('db');
const backend = bo.storage.local;

const backendGet = (
  keys: string | string[]
): TE.TaskEither<chrome.runtime.LastError, Record<string, any>> => {
  dbLogger.debug(`Getting %O from local storage`, keys);
  return pipe(
    TE.tryCatch(
      () =>
        new Promise<Record<string, any>>((resolve) =>
          backend.get(keys, resolve)
        ),
      E.toError
    ),
    TE.chain((v) => TE.fromEither(catchRuntimeLastError(v)))
  );
};

const backendSet = <A>(
  key: string,
  value: A
): TE.TaskEither<chrome.runtime.LastError, void> => {
  dbLogger.debug(`Save %j to "%s"`, value, key);
  return pipe(
    TE.tryCatch(
      () =>
        new Promise<void>((resolve) => backend.set({ [key]: value }, resolve)),
      E.toError
    ),
    TE.chain((v) => TE.fromEither(catchRuntimeLastError(v)))
  );
};

function get<A>(
  key: string
): TE.TaskEither<chrome.runtime.LastError, A | null> {
  return pipe(
    backendGet([key]),
    TE.map((val) => {
      dbLogger.debug('DB: value for key %s %O', key, val);
      return val;
    }),
    TE.map((val) => val?.[key] ?? null)
  );
}

function set<A>(
  key: string,
  value: A
): TE.TaskEither<chrome.runtime.LastError, A> {
  return pipe(
    backendSet(key, value),
    TE.map(() => value)
  );
}

function update<A extends object>(
  key: string,
  value: A | undefined | null
): TE.TaskEither<chrome.runtime.LastError, A | null> {
  const S = getAssignSemigroup<A>();
  dbLogger.debug(`Update key %s with data: %O`, key, value);
  return pipe(
    get<A>(key),
    TE.chain((val) =>
      val !== null && value !== undefined && value !== null
        ? set(key, S.concat(val, value))
        : set(key, value ?? null)
    )
  );
}

const remove = (key: string): TE.TaskEither<chrome.runtime.LastError, void> =>
  pipe(
    TE.tryCatch(() => backend.remove(key), E.toError),
    TE.chain((v) => TE.fromEither(catchRuntimeLastError(v)))
  );

export default {
  get,
  set,
  update,
  remove,
};
