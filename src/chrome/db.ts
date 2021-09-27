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
  console.log(`Getting ${keys.toString()} from local storage`);
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
  console.log(`Save ${JSON.stringify(value)} as ${key}`);
  return pipe(
    TE.fromIO<undefined, chrome.runtime.LastError>(() =>
      (backend as any).set({ [key]: value })
    ),
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
      console.log(`Got value from ${key}`, val);
      return val;
    }),
    TE.map((val) => (val?.[key] !== undefined ? val[key] : val))
  );
  // return new Promise((resolve, reject) => {
  //   backend.get(key, (val) => {
  //     if (bo.runtime.lastError !== undefined) {
  //       reject(bo.runtime.lastError);
  //     } else if (isEmpty(val) && !isEmpty(setIfMissing)) {
  //       const newVal = isFunction(setIfMissing)
  //         ? setIfMissing(key)
  //         : setIfMissing;
  //       // eslint-disable-next-line no-console
  //       console.log('get is empty ', newVal);
  //       backend.set(newVal, () => resolve(newVal));
  //     } else {
  //       // eslint-disable-next-line no-console
  //       console.log('get returns', val, key, val[key]);
  //       resolve(isEmpty(val[key]) ? null : val[key]);
  //     }
  //   });
  // });
}

function set<A>(
  key: string,
  value: A
): TE.TaskEither<chrome.runtime.LastError, A> {
  // eslint-disable-next-line no-console
  return pipe(
    backendSet(key, value),
    TE.map(() => {
      console.log('after set');
      return value;
    })
  );
  // return new Promise((resolve, reject) => {
  //   const newVal = {};
  //   newVal[key] = isFunction(value) ? value(key) : value;
  //   backend.set(newVal, () => {
  //     if (bo.runtime.lastError) {
  //       reject(bo.runtime.lastError);
  //     } else {
  //       resolve(newVal[key]);
  //     }
  //   });
  // });
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
