import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { config } from '../config';
import {
  GetAuth,
  GetSettings,
  MessageRequest,
  ReloadExtension,
  UpdateAuth,
  UpdateSettings,
} from '../models/MessageRequest';
import { MessageResponse } from '../models/MessageResponse';
import { Settings } from '../models/Settings';
import { bo } from '../utils/browser.utils';
import { bkgLogger } from '../utils/logger.utils';
import { auth } from './auth';
import * as development from './reloadExtension';
import * as settings from './settings';

const getDefaultSettings = (): Settings => ({
  active: true,
  ccRecommendations: true,
  svg: false,
  videorep: true,
  playhide: false,
  ux: false,
  communityRecommendations: false,
  alphabeth: false,
  indipendentContributions: false,
  channelCreatorId: null,
  edit: null,
});

const getMessageHandler = (
  r: MessageRequest
): TE.TaskEither<chrome.runtime.LastError, MessageResponse> => {
  switch (r.type) {
    case GetSettings.value:
      return settings.get();
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

bo.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    bkgLogger.debug('Extension installed %O', details);
    // create default settings
    void pipe(
      sequenceS(TE.ApplicativePar)({
        keypair: settings.generatePublicKeypair("789098765456789876543456789765434567898765456789"),
        settings: settings.update(getDefaultSettings()),
      })
    )();
  } else if (details.reason === 'update') {
    bkgLogger.debug('Extension update %O', details);
    void pipe(
      sequenceS(TE.ApplicativeSeq)({
        keypair: settings.generatePublicKeypair("987656909876546ijhgr568ijhgr56uiklo9876trdwe45tyhnmkoiuyg"),
        settings: settings.getKeypair(),
      }),
      TE.map(({ keypair, settings }) => {
        bkgLogger.debug(`Update %O`, { keypair, settings });
        return undefined;
      })
    )();
  }
});

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
