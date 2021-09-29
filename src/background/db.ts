import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { bo } from '../utils/browser.utils';
import { pipe } from 'fp-ts/lib/function';
import { getAssignSemigroup } from 'fp-ts/lib/struct';
import { catchRuntimeLastError } from '../providers/browser.provider';

const backend = bo.storage.local;

const backendGet = (
  keys: string | string[]
): TE.TaskEither<chrome.runtime.LastError, Record<string, any>> => {
  // console.log(`Getting ${keys.toString()} from local storage`);
  return pipe(
    TE.tryCatch(() => {
      return new Promise<Record<string, any>>((resolve) => {
        // eslint-disable-next-line
        backend.get(keys, resolve);
      });
    }, E.toError),
    TE.chain(catchRuntimeLastError)
  );
};

const backendSet = <A>(
  key: string,
  value: A
): TE.TaskEither<chrome.runtime.LastError, void> => {
  // eslint-disable-next-line
  console.log(`Save ${JSON.stringify(value)} as ${key}`);
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
    TE.map((val) => (val?.[key] !== undefined ? val[key] : val))
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
  value: A
): TE.TaskEither<chrome.runtime.LastError, A> {
  const S = getAssignSemigroup<A>();
  return pipe(
    get<A>(key),
    TE.chain((val) =>
      val !== undefined ? set(key, S.concat(val, value)) : set(key, value)
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
