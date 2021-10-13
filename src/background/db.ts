import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { bo } from '../utils/browser.utils';
import { pipe } from 'fp-ts/lib/function';
import { getAssignSemigroup } from 'fp-ts/lib/struct';
import { catchRuntimeLastError } from '../providers/browser.provider';
import { bkgLogger } from 'utils/logger.utils';

const backend = bo.storage.local;

const backendGet = (
  keys: string | string[]
): TE.TaskEither<chrome.runtime.LastError, Record<string, any>> => {
  bkgLogger.debug(`Getting %O from local storage`, keys);
  return pipe(
    TE.tryCatch(
      () =>
        new Promise<Record<string, any>>((resolve) =>
          backend.get(keys, resolve)
        ),
      E.toError
    ),
    TE.chain(catchRuntimeLastError)
  );
};

const backendSet = <A>(
  key: string,
  value: A
): TE.TaskEither<chrome.runtime.LastError, void> => {
  bkgLogger.debug(`Save ${JSON.stringify(value)} as ${key}`);
  return pipe(
    TE.tryCatch(() => backend.set({ [key]: value }), E.toError),
    TE.chain(catchRuntimeLastError)
  );
};

const backendRemove = (
  key: string
): TE.TaskEither<chrome.runtime.LastError, void> =>
  pipe(
    TE.fromIO<undefined, chrome.runtime.LastError>(
      () => backend.remove(key) as any
    ),
    TE.chain(catchRuntimeLastError)
  );

function get<A>(
  key: string
): TE.TaskEither<chrome.runtime.LastError, A | undefined> {
  return pipe(
    backendGet([key]),
    TE.map((val) => {
      bkgLogger.debug('DB: value for key %s %O', key, val);
      return val;
    }),
    TE.map((val) => val?.[key])
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
  value: A | undefined
): TE.TaskEither<chrome.runtime.LastError, A | undefined> {
  const S = getAssignSemigroup<A>();
  bkgLogger.debug(`Update key %s with data: %O`, key, value);
  return pipe(
    get<A>(key),
    TE.chain((val) =>
      val !== undefined && value !== undefined
        ? set(key, S.concat(val, value))
        : set(key, value)
    )
  );
}

const remove = backendRemove;

export default {
  get: get,
  set: set,
  update: update,
  remove: remove,
};
