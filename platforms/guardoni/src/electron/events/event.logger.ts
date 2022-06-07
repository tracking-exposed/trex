import { Logger } from '@shared/logger';
import { v4 as uuid } from 'uuid';
import { EVENTS } from '../models/events';
import log from 'electron-log';
import * as util from 'util';

export const getEventsLogger = (w: Electron.BrowserWindow): Logger => {
  return {
    error: (m, ...args) => {
      log.error(m, ...args);
      w.webContents.postMessage(EVENTS.GUARDONI_ERROR_EVENT.value, {
        id: uuid(),
        level: 'Error',
        message: util.format(m, ...args),
        details: args.map((a) => JSON.stringify(a)),
      });
    },
    info: (m: string, ...args: any[]) => {
      log.info(m, ...args);
      w.webContents.postMessage(EVENTS.GUARDONI_OUTPUT_EVENT.value, {
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
    extend: (n: string) => {
      return log as any;
    },
  };
};
