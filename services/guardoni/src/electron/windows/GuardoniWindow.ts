import { BrowserWindow } from 'electron';
import puppeteer from 'puppeteer-core';
import pie from 'puppeteer-in-electron';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError, toAppError } from '@shared/errors/AppError';

/**
 * Create guardoni window as child of main electron window
 *
 */
export const createGuardoniWindow = (
  app: Electron.App,
  parentWindow: BrowserWindow
): TE.TaskEither<
  AppError,
  { browser: puppeteer.Browser; window: BrowserWindow }
> => {
  return TE.tryCatch(async () => {
    const browser = await pie.connect(app, puppeteer);

    const window = new BrowserWindow({
      show: false,
      parent: parentWindow,
    });

    return { browser, window };
  }, toAppError);
};
