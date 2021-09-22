import { bo } from '../utils/browser.utils';
import { MessageRequest } from '../models/MessageRequest';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';

export const catchRuntimeLastError = <A>(
  v: A
): TE.TaskEither<chrome.runtime.LastError, A> => {
  if (bo.runtime.lastError !== null && bo.runtime.lastError !== undefined) {
    // eslint-disable-next-line
    console.error('LastError', bo.runtime.lastError);
    return TE.left(bo.runtime.lastError);
  }
  return TE.right(v);
};

export const sendMessage = <A>(
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, A> =>
  pipe(
    TE.tryCatch(
      () =>
        new Promise<A>((resolve) => {
          bo.runtime.sendMessage<any, A>(r, resolve);
        }),
      E.toError
    ),
    TE.chain(catchRuntimeLastError)
  );
