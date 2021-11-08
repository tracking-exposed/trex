import { ContentCreator } from '@backend/models/ContentCreator';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { config } from '../config';
import {
  APIRequest,
  DeleteKeypair,
  ErrorOccurred,
  GenerateKeypair,
  GetAuth,
  GetContentCreator,
  GetKeypair,
  GetSettings,
  Messages,
  MessageType,
  ReloadExtension,
  UpdateAuth,
  UpdateContentCreator,
  UpdateSettings
} from '../models/Messages';
import { getDefaultSettings, Keypair, Settings } from '../models/Settings';
import { APIError, apiFromEndpoint } from '../providers/api.provider';
import {
  catchRuntimeLastError,
  toBrowserError
} from '../providers/browser.provider';
import { bo } from '../utils/browser.utils';
import { fromStaticPath } from '../utils/endpoint.utils';
import { bkgLogger } from '../utils/logger.utils';
import db from './db';
import * as development from './reloadExtension';
import * as settings from './settings';

const SETTINGS_KEY = 'settings';
const AUTH_KEY = 'auth';
const CONTENT_CREATOR = 'content-creator';

export const getStorageKey = (type: string): string => {
  switch (type) {
    case GetKeypair.value:
      return settings.PUBLIC_KEYPAIR;
    case GetSettings.value:
    case UpdateSettings.value:
      return SETTINGS_KEY;
    case GetAuth.value:
    case UpdateAuth.value:
      return AUTH_KEY;
    case GetContentCreator.value:
    case UpdateContentCreator.value:
      return CONTENT_CREATOR;
    default:
      return '';
  }
};

interface MessageHandlerError {
  type: typeof ErrorOccurred.value;
  response: {
    name: string;
    message: string;
    details: string[];
  };
}

const toMessageHandleError = (
  e: chrome.runtime.LastError | APIError | Error
): MessageHandlerError => {
  if (e instanceof APIError) {
    return {
      type: ErrorOccurred.value,
      response: {
        name: e.name,
        message: e.message,
        details: [],
      },
    };
  }

  if (e instanceof Error) {
    return {
      type: ErrorOccurred.value,
      response: {
        name: e.name,
        message: e.message ?? 'An error occurred',
        details: [],
      },
    };
  }

  if (e.message !== undefined) {
    return {
      type: ErrorOccurred.value,
      response: {
        name: 'RuntimeLastError',
        message: e.message ?? 'An error occurred',
        details: [],
      },
    };
  }

  return {
    type: ErrorOccurred.value,
    response: {
      name: 'UnknownError',
      message: e.message ?? 'An error occurred',
      details: [],
    },
  };
};

const getMessageHandler = <M extends Messages[keyof Messages]>(
  r: M['Request']
): TE.TaskEither<MessageHandlerError, M['Response']> => {
  switch (r.type) {
    // keypair
    case GenerateKeypair.value:
      return pipe(
        settings.generatePublicKeypair(''),
        TE.mapLeft(toMessageHandleError)
      );
    case DeleteKeypair.value:
      return pipe(
        settings.deletePublicKeypair(),
        TE.mapLeft(toMessageHandleError)
      );
    // gets
    case GetSettings.value:
    case GetKeypair.value:
    case GetAuth.value:
    case GetContentCreator.value:
      return pipe(
        db.get<any>(getStorageKey(r.type)),
        TE.mapLeft(toMessageHandleError),
        TE.map((response) => ({ type: r.type, response }))
      );
    // updates
    case UpdateContentCreator.value:
    case UpdateSettings.value:
    case UpdateAuth.value:
      return pipe(
        db.update(getStorageKey(r.type), r.payload),
        TE.mapLeft(toMessageHandleError),
        TE.map((response): M['Response'] => ({ type: r.type as any, response }))
      );
    case APIRequest.value:
      return pipe(
        fromStaticPath(r.payload?.staticPath),
        O.fromNullable,
        TE.fromOption(() =>
          toMessageHandleError(
            new Error(
              `No endpoint found by the given path: ${
                r.payload?.staticPath ?? ''
              }`
            )
          )
        ),
        TE.chain((e) =>
          pipe(
            apiFromEndpoint(e)(r.payload?.Input ?? {}),
            TE.chain(catchRuntimeLastError),
            TE.mapLeft(toMessageHandleError)
          )
        ),
        TE.map((response): M['Response'] => ({
          type: APIRequest.value,
          response,
        }))
      );
    default:
      return TE.right({
        type: ErrorOccurred.value,
        response: toBrowserError(
          new Error(`Message type ${r.type} does not exist.`)
        ),
      });
  }
};

bo.runtime.onMessage.addListener(
  (request: MessageType<any, any, any>, sender, sendResponse) => {
    // eslint-disable-next-line no-console
    bkgLogger.debug('message received', request, sender);

    if (config.NODE_ENV === 'development') {
      if (request.type === ReloadExtension.value) {
        development.reloadExtension();
      }
    }

    getMessageHandler(request)()
      .then((r) => {
        if (E.isRight(r)) {
          bkgLogger.debug('Response for request %s: %O', request.type, r.right);
          return sendResponse(r.right);
        }

        // eslint-disable-next-line
        bkgLogger.error('Failed to process request %O', r.left);

        return undefined;
      })
      // eslint-disable-next-line
      .catch((e) => bkgLogger.error('An error occurred %O', e));

    // this enable async response
    return true;
  }
);

bo.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    bkgLogger.debug('Extension installed %O', details);
    // create default settings
    void pipe(
      sequenceS(TE.ApplicativePar)({
        keypair: settings.generatePublicKeypair(''),
        profile: db.update(UpdateContentCreator.value, null),
        settings: db.update(UpdateSettings.value, getDefaultSettings()),
      })
    )();
  } else if (details.reason === 'update') {
    void pipe(
      sequenceS(TE.ApplicativePar)({
        keypair: pipe(
          db.get<Keypair>(getStorageKey(GetKeypair.value)),
          TE.chain(
            (
              r
            ): TE.TaskEither<
              chrome.runtime.LastError,
              | Messages['GenerateKeypair']['Response']
              | Messages['GetKeypair']['Response']
            > =>
              r === null
                ? settings.generatePublicKeypair('')
                : TE.right({ type: GetKeypair.value, response: r })
          )
        ),
        settings: pipe(
          db.get<Settings>(getStorageKey(GetSettings.value)),
          TE.chain((r) =>
            r === null
              ? db.update(
                  getStorageKey(GetSettings.value),
                  getDefaultSettings()
                )
              : TE.right(r)
          )
        ),
        // check profile is not `undefined` on extension update and set it to `null`
        profile: pipe(
          db.get<ContentCreator>(getStorageKey(GetContentCreator.value)),
          TE.chain((r) =>
            r === undefined
              ? db.update(getStorageKey(GetContentCreator.value), null)
              : TE.right(r)
          )
        ),
      })
    )();
  }
});
