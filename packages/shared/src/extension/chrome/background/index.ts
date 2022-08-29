import { Message } from '../../models/Message';
import UserSettings from '../../models/UserSettings';
import logger from '../../logger';
import { bo } from '../../utils/browser.utils';
import * as account from './account';
import * as reloadExtension from './reloadExtension';
import * as sync from './sync';

export const MessageHandler =
  (opts: sync.LoadOpts, onConfigChange: (c: Partial<UserSettings>) => void) =>
  (request: Message, sender: any, sendResponse: any) => {
    if (request.type === 'SettingsLookup') {
      void account.handleSettingsLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'LocalLookup') {
      void account.handleLocalLookup(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ServerLookup') {
      void account.handleServerLookup(opts)(request.payload, sendResponse);
      return true;
    }

    if (request.type === 'ConfigUpdate') {
      void account.handleConfigUpdate(request.payload, (c) => {
        onConfigChange(c);
        return sendResponse(c);
      });
      return true;
    }

    if (request.type === 'apiSync') {
      void sync.handleAPISyncMessage(opts)(request, sender, sendResponse);
      return true;
    }

    if (request.type === 'sync') {
      void sync.handleSyncMessage(opts)(request, sender, sendResponse);
      return true;
    }
  };

// bind the scoped message listener
export const load = (opts: sync.LoadOpts): void => {
  logger.debug(`Bind background events %O`, opts);
  reloadExtension.load();

  bo.runtime.onConnect.addListener((port) => {
    logger.debug('Port connected: %O', port);

    const handleMessage = MessageHandler(opts, (c) => {
      logger.debug('Config updated %O', c);
      if (port.name === 'ConfigUpdate') {
        port.postMessage({ type: 'Reload', payload: c });
        return true;
      }
    });

    bo.runtime.onMessage.addListener(handleMessage);
  });
};
