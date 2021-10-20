import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { MessageRequest } from '../models/MessageRequest';
import { bo } from '../utils/browser.utils';
import { bkgLogger } from '../utils/logger.utils';

export const toBrowserError = (e: unknown): chrome.runtime.LastError => {
  // eslint-disable-next-line
  bkgLogger.error('An error occured %O', e);
  if (e instanceof Error) {
    return { message: e.message };
  }

  if (e !== undefined) {
    if ((e as any).message !== undefined) {
      return { message: (e as any).message };
    }
  }
  return { message: 'Unknown error' };
};

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

export const sendMessage = <R extends { type: string; response: any }>(
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, R['response']> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<R>((resolve) => {
          bo.runtime.sendMessage<any, R>(r, resolve);
        }),
      E.toError
    ),
    TE.chain(catchRuntimeLastError),
    TE.chain((r) => {
      if (r.type === 'error') {
        return TE.left(toBrowserError(r.response));
      }
      return TE.right(r.response);
    })
  );
