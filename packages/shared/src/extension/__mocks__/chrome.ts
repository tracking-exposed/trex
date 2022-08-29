import { chrome } from 'jest-chrome';
import { GetLogger } from '../../logger';
import {
  handleLocalLookup,
  handleServerLookup,
  handleSettingsLookup,
} from '../chrome/background/account';
import * as sync from '../chrome/background/sync';
import { handleSyncMessage } from '../chrome/background/sync';
import UserSettings from '../models/UserSettings';

const logger = GetLogger('chrome-mock');

interface ChromeMock {
  chrome: typeof chrome;
  portMock: chrome.runtime.Port;
  chromeListener: jest.Mock;
}

interface GetChromeMockOpts {
  getConfig: () => UserSettings;
  backgroundOpts: sync.LoadOpts;
}

export const getChromeMock = ({
  getConfig,
  backgroundOpts,
}: GetChromeMockOpts): ChromeMock => {
  const chromeListener = jest.fn();

  chromeListener.mockImplementation((request, sender, sendResponse) => {
    logger.info('on listener %O', { request, sender });
    sendResponse({ type: 'Success', response: null });
    return true;
  });

  chrome.runtime.sendMessage
    // mock first 'chromeConfig' message handler
    // .mockImplementationOnce((msg, cb: any) => {
    //   return cb({ ux: true, active: true });
    // })
    // mock 'LocalLookup' message handler
    .mockImplementation((msg: any, cb: any) => {
      // mock 'SettingsLookup' message handler
      if (msg.type === 'SettingsLookup') {
        const settings = getConfig();
        dbMap.local = settings as any;
        return handleSettingsLookup({ userId: 'local' }, cb);
        // mock 'LocalLookup' message handler
      } else if (msg.type === 'LocalLookup') {
        return handleLocalLookup({ userId: 'local' }, cb);
      } else if (msg.type === 'ServerLookup') {
        return handleServerLookup(backgroundOpts)(msg.payload, cb);
      } else if (msg.type === 'sync') {
        return handleSyncMessage(backgroundOpts)(msg, null, cb);
      }

      // eslint-disable-next-line n/no-callback-literal
      return cb({
        type: 'Error',
        error: new Error(`Message type ${msg.type} not handled`),
      });
    });

  let dbMap = {
    local: undefined,
  };

  chrome.storage.local.get.mockImplementation((key: any, cb: any) => {
    logger.debug('Get Storage key (%s) %O', key, dbMap);
    return cb(dbMap);
  });

  chrome.storage.local.set.mockImplementation((obj: any, cb: any) => {
    logger.debug('Set Storage key %O', obj);
    dbMap = {
      ...dbMap,
      ...obj,
    };
    return cb();
  });

  const portMock = {
    name: 'ConfigUpdate',
    onMessage: {
      addListener: jest.fn(),
      hasListener: jest.fn(),
      getRules: jest.fn(),
      removeRules: jest.fn(),
    },
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    onDisconnect: jest.fn(),
  };

  chrome.runtime.connect.mockReturnValue(portMock as any);

  return { chrome, portMock: portMock as any, chromeListener };
};
