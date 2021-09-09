import * as TE from 'fp-ts/lib/TaskEither';
import * as IOE from 'fp-ts/lib/IOEither';

export const setItem = (key, value) =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      console.log(`Setting key ${key}`, value);
      return window.localStorage.setItem(key, value);
    })
  );

export const getItem = (key) =>
  TE.fromIOEither(
    IOE.tryCatch(() => {
      return window.localStorage.getItem(key);
    })
  );
