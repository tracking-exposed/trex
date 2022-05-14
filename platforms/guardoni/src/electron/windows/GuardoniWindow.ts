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
  window: BrowserWindow
): TE.TaskEither<AppError, { browser: puppeteer.Browser }> => {
  return TE.tryCatch(async () => {
    const browser = await pie.connect(app, puppeteer);

    return { browser };
  }, toAppError);
};
