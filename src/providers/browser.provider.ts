import { bo } from '../utils/browser.utils';
import { MessageRequest } from '../models/MessageRequest';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import { bkgLogger } from '../utils/logger.utils';

export const catchRuntimeLastError = <A>(
  v: A
): TE.TaskEither<chrome.runtime.LastError, A> => {
  if (bo.runtime.lastError !== null && bo.runtime.lastError !== undefined) {
    // eslint-disable-next-line
    bkgLogger.error('Runtime error catched %O', bo.runtime.lastError);
    return TE.left(bo.runtime.lastError);
  }
  return TE.right(v);
};

export const sendMessage = <R>(
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, R> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<R>((resolve) => {
          bo.runtime.sendMessage<any, R>(r, resolve);
        }),
      E.toError
    ),
    TE.chain(catchRuntimeLastError)
  );
