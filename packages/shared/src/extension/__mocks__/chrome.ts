import { chrome } from 'jest-chrome';
import { GetLogger } from '../../logger';
import { MessageHandler } from '../chrome/background';
import * as sync from '../chrome/background/sync';

const logger = GetLogger('chrome-mock');

interface ChromeMock {
  chrome: typeof chrome;
  portMock: chrome.runtime.Port;
  chromeListener: jest.Mock;
  clearDB: () => void;
}

interface GetChromeMockOpts {
  backgroundOpts: sync.LoadOpts;
}

export const getChromeMock = ({
  backgroundOpts,
}: GetChromeMockOpts): ChromeMock => {
  const chromeListener = jest.fn();

  chromeListener.mockImplementation((request, sender, sendResponse) => {
    logger.info('on listener %O', { request, sender });
    sendResponse({ type: 'Success', response: null });
    return true;
  });

  // mock sendMessage with our implementation
  chrome.runtime.sendMessage.mockImplementation(async (msg: any, cb: any) => {
    MessageHandler(backgroundOpts, () => {})(msg, {}, cb);
    return true;
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

  return {
    chrome,
    portMock: portMock as any,
    chromeListener,
    clearDB: () => {
      dbMap = { local: undefined };
    },
  };
};
