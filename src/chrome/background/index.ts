import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { MessageResponse } from 'models/MessageResponse';
import { config } from '../../config';
import {
  ConfigUpdate,
  LocalLookup,
  MessageRequest,
  RecommendationsFetch,
  ReloadExtension,
  Sync,
} from '../../models/MessageRequest';
import { bo } from '../../utils/browser.utils';
import * as accounts from './account';
import * as development from './reloadExtension';
import * as sync from './sync';

const getMessageHandler = (
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, MessageResponse> => {
  switch (r.type) {
    case LocalLookup.value:
      return accounts.userLookup(
        r.payload !== undefined
          ? r.payload
          : { userId: accounts.DEFAULT_USER_NAME }
      );
    case RecommendationsFetch.value:
      return accounts.serverLookup(r.payload);
    case ConfigUpdate.value:
      return accounts.configUpdate(r.payload);
    case Sync.value:
      return sync.sync(r);
    default:
      return TE.right({} as any);
  }
};

bo.runtime.onMessageExternal.addListener(
  (request: MessageRequest, sender, sendResponse) => {
    // eslint-disable-next-line no-console
    console.log('focacci', request, sender);

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
        console.error(r.left);

        return undefined;
      })
      // eslint-disable-next-line
      .catch(console.error);

    // this enable async response
    return true;
  }
);
