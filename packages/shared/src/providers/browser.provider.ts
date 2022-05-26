import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { MinimalEndpointInstance, TypeOfEndpointInstance } from '../endpoints';
import { bo } from '../extension/utils/browser.utils';
import { getStaticPath } from '../utils/endpoint.utils';
import { trexLogger } from '../logger';

const log = trexLogger.extend('browser');

export const APIRequest = t.literal('APIRequest');
export type APIRequest = t.TypeOf<typeof APIRequest>;

// error
export const ErrorOccurred = t.literal('ErrorOccurred');
export type ErrorOccurred = t.TypeOf<typeof ErrorOccurred>;

export const toBrowserError = (e: unknown): chrome.runtime.LastError => {
  // eslint-disable-next-line
  log.error('An error occurred %O', e);
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
): E.Either<chrome.runtime.LastError, A> => {
  if (bo.runtime.lastError !== null && bo.runtime.lastError !== undefined) {
    // eslint-disable-next-line
    log.error('Runtime error caught %O', bo.runtime.lastError);
    return E.left(bo.runtime.lastError);
  }
  return E.right(v);
};

export interface MessageType<K extends string, P = unknown, R = unknown> {
  type: K;
  payload: P;
  response: R;
}

interface MessageResponse<K extends string, P = unknown> {
  type: K;
  response: P;
}

interface MessageRequest<K extends string, R = unknown> {
  type: K;
  payload?: R;
}

export type MessagesAPI<
  A extends { [key: string]: Omit<MessageType<typeof key, any, any>, 'type'> }
> = {
  [K in keyof A]: K extends string
    ? {
        Request: MessageRequest<K, A[K]['payload']['_A']>;
        Response: MessageResponse<K, A[K]['response']['_A']>;
      }
    : never;
};

export const MessagesAPI = <
  A extends { [key: string]: Omit<MessageType<typeof key, any, any>, 'type'> }
>(
  defs: A
): MessagesAPI<A> => {
  return pipe(
    defs,
    R.mapWithIndex<string, MessageType<any, any>, any>((l, m) => ({
      Request: {
        type: l,
        payload: m.payload,
      },
      Response: {
        type: l,
        response: m.response,
      },
    })) as any
  );
};

export interface BrowserProvider<MM extends MessagesAPI<any>> {
  sendMessage: <M extends MM[keyof MM]>(
    m: M
  ) => (
    p?: M['Request']['payload']
  ) => TE.TaskEither<chrome.runtime.LastError, M['Response']['response']>;
  sendTabMessage: <M extends MM[keyof MM]>(
    m: M
  ) => (
    tabId: number,
    p?: M['Request']['payload']
  ) => TE.TaskEither<chrome.runtime.LastError, M['Response']['response']>;
  sendAPIMessage: <E extends MinimalEndpointInstance>(
    e: E
  ) => (
    p: TypeOfEndpointInstance<E>['Input']
  ) => TE.TaskEither<
    chrome.runtime.LastError,
    TypeOfEndpointInstance<E>['Output']
  >;
}

export const tabsQuery = (): TE.TaskEither<
  chrome.runtime.LastError,
  chrome.tabs.Tab[] | undefined
> => {
  return pipe(
    TE.tryCatch(() => {
      return new Promise<chrome.tabs.Tab[] | undefined>((resolve) => {
        bo.tabs.query(
          { active: true, currentWindow: true, url: 'https://*.youtube.com/*' },
          resolve
        );
      });
    }, E.toError),
    TE.chain((v) => TE.fromEither(catchRuntimeLastError(v)))
  );
};

export const GetBrowserProvider = <Messages extends MessagesAPI<any>>(
  mm: Messages
): BrowserProvider<Messages> => {
  const sendMessage =
    <M extends Messages[keyof Messages]>(r: M) =>
    (
      p?: M['Request']['payload']
    ): TE.TaskEither<chrome.runtime.LastError, M['Response']['response']> =>
      pipe(
        TE.tryCatch(
          () =>
            new Promise<M['Response']>((resolve) => {
              log.debug(
                'Sending message %s with payload %O',
                r.Request.type,
                p
              );
              bo.runtime.sendMessage<M['Request'], M['Response']>(
                { type: r.Request.type, payload: p },
                resolve
              );
            }),
          E.toError
        ),
        TE.chain((v) => TE.fromEither(catchRuntimeLastError(v))),
        TE.chain((result) => {
          if (result.type === ErrorOccurred.value) {
            return TE.left(toBrowserError(result.response));
          }
          return TE.right(result.response);
        })
      );

  const sendTabMessage =
    <M extends Messages[keyof Messages]>(r: M) =>
    (
      tabId: number,
      p?: M['Request']['payload']
    ): TE.TaskEither<chrome.runtime.LastError, M['Response']['response']> => {
      return pipe(
        TE.tryCatch(() => {
          return new Promise<any>((resolve, reject) => {
            log.debug(
              'Sending message to tab %s %s with payload %O',
              tabId,
              r.Request.type,
              p
            );
            return bo.tabs.sendMessage<M['Request'], M['Response']>(
              tabId,
              { type: r.Request.type, payload: p },
              resolve
            );
          });
        }, E.toError),
        TE.chain((e) => TE.fromEither(catchRuntimeLastError(e)))
      );
    };

  const sendAPIMessage =
    <E extends MinimalEndpointInstance>(endpoint: E) =>
    (
      Input: TypeOfEndpointInstance<E>['Input']
    ): TE.TaskEither<
      chrome.runtime.LastError,
      TypeOfEndpointInstance<E>['Output']
    > => {
      const staticPath = getStaticPath(endpoint, Input);
      log.debug(
        'Sending API message for endpoint %s with payload %O',
        staticPath,
        Input
      );
      return pipe(
        TE.tryCatch(
          () =>
            new Promise<TypeOfEndpointInstance<E>['Output']>((resolve) => {
              bo.runtime.sendMessage<
                {
                  type: typeof APIRequest.value;
                  payload: {
                    staticPath: string;
                    Input: TypeOfEndpointInstance<E>['Input'];
                  };
                },
                TypeOfEndpointInstance<E>['Output']
              >(
                {
                  type: APIRequest.value,
                  payload: {
                    staticPath,
                    Input,
                  },
                },
                resolve
              );
            }),
          E.toError
        ),
        TE.chain((v) => TE.fromEither(catchRuntimeLastError(v))),
        TE.chain((result) => {
          log.debug('Response for %s received %O', staticPath, result);
          if (result.type === ErrorOccurred.value) {
            return TE.left(toBrowserError(result.response));
          }
          return TE.right(result.response);
        })
      );
    };

  return {
    sendMessage,
    sendTabMessage,
    sendAPIMessage,
  };
};
