import { Logger } from '@shared/logger';
import { v4 as uuid } from 'uuid';
import { GUARDONI_ERROR_EVENT, GUARDONI_OUTPUT_EVENT } from '../models/events';
import log from 'electron-log';
import * as util from 'util';

export const getEventsLogger = (
  w: Electron.BrowserWindow
): Pick<Logger, 'error' | 'info' | 'debug' | 'warn'> => {
  return {
    error: (m, ...args) => {
      log.error(m, ...args);
      w.webContents.postMessage(GUARDONI_ERROR_EVENT.value, {
        id: uuid(),
        level: 'Error',
        message: util.format(m, ...args),
        details: args.map((a) => JSON.stringify(a)),
      });
    },
    info: (m: string, ...args: any[]) => {
      log.info(m, ...args);
      w.webContents.postMessage(GUARDONI_OUTPUT_EVENT.value, {
        id: uuid(),
        level: 'Info',
        message: util.format(m, ...args),
        details: args.map((a) => JSON.stringify(a)),
      });
    },
    warn: (m, ...args) => {
      log.warn(m, ...args);
      // w.webContents.postMessage(GUARDONI_OUTPUT_EVENT.value, {
      //   id: uuid(),
      //   level: 'Debug',
      //   message: util.format(m, ...args),
      //   details: args.map((a) => JSON.stringify(a)),
      // });
    },
    debug: (m, ...args) => {
      log.debug(m, ...args);
      // w.webContents.postMessage(GUARDONI_OUTPUT_EVENT.value, {
      //   id: uuid(),
      //   level: 'Debug',
      //   message: util.format(m, ...args),
      //   details: args.map((a) => JSON.stringify(a)),
      // });
    },
  };
};
