import * as E from 'fp-ts/lib/Either';
import * as IOE from 'fp-ts/lib/IOEither';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';

export const setPersistentItem = (
  key: string,
  value: string
): TE.TaskEither<Error, void> =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      // eslint-disable-next-line no-console
      console.log(`Setting key ${key}`, value);
      return window.localStorage.setItem(key, value);
    }, E.toError)
  );

export const getPersistentItem = (
  key: string
): TE.TaskEither<Error, string | undefined> =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      // eslint-disable-next-line no-console
      console.log(`Getting item at key ${key}`);
      return window.localStorage.getItem(key) ?? undefined;
    }, E.toError)
  );

export const removePersistenItem = (key: string): TE.TaskEither<Error, void> =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      // eslint-disable-next-line no-console
      console.log(`Removing item at key ${key}`);
      return window.localStorage.removeItem(key);
    }, E.toError)
  );

export const clearPersistentItem = (key: string): TE.TaskEither<Error, void> =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      // eslint-disable-next-line no-console
      console.log(`Clearing item at key ${key}`);
      return window.localStorage.clear();
    }, E.toError)
  );

const store = {};
export const setItem = <A>(key: string, value: A): TE.TaskEither<Error, void> =>
  TE.fromIO(() => {
    // eslint-disable-next-line no-console
    console.log(`Setting key ${key}`, value);
    (store as any)[key] = value;
  });

export const getItem = <A>(key: string): TE.TaskEither<Error, O.Option<A>> =>
  TE.right(O.fromNullable((store as any)[key]));
