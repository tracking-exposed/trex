import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { MessageResponse } from '../models/MessageResponse';
import { config } from '../config';
import {
  UpdateSettings,
  GetSettings,
  MessageRequest,
  ReloadExtension,
  UpdateAuth,
  GetAuth,
} from '../models/MessageRequest';
import { bo } from '../utils/browser.utils';
import * as settings from './settings';
import * as development from './reloadExtension';
import { auth } from './auth';
import { bkgLogger } from '../utils/logger.utils';

const getMessageHandler = (
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, MessageResponse> => {
  switch (r.type) {
    case GetSettings.value:
      return settings.userLookup();
    // case RecommendationsFetch.value:
    //   return settings.serverLookup(r.payload);
    case UpdateSettings.value:
      return settings.update(r.payload);
    // auth
    case GetAuth.value:
      return auth.get();
    case UpdateAuth.value:
      return auth.update(r.payload);
    default:
      return TE.right({} as any);
  }
};

bo.runtime.onMessage.addListener(
  (request: MessageRequest, sender, sendResponse) => {
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
          return sendResponse(r.right);
        }

        // eslint-disable-next-line
        bkgLogger.error('Failed to process request %O', r.left);

        return undefined;
      })
      // eslint-disable-next-line
      .catch((e) => bkgLogger.error('An error occured %O', e));

    // this enable async response
    return true;
  }
);
