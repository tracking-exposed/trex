import * as TE from 'fp-ts/lib/TaskEither';
import * as IOE from 'fp-ts/lib/IOEither';

export const setPersistentItem = (key, value) =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      console.log(`Setting key ${key}`, value);
      return window.localStorage.setItem(key, value);
    })
  );

export const getPersistentItem = (key) =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      console.log(`Getting item at key ${key}`);
      return window.localStorage.getItem(key);
    })
  );

export const clearPersistentItem = (key) =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      console.log(`Clearing item at key ${key}`);
      return window.localStorage.clear(key);
    })
  );

const store = {};
export const setItem = (key, value) =>
  TE.fromIO(() => {
    console.log(`Setting key ${key}`, value);
    store[key] = value;
  });

export const getItem = (key) =>
  TE.fromIO(() => {
    return store[key];
  });
