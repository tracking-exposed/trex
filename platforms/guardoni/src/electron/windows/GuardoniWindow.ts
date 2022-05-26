import { BrowserWindow } from 'electron';
import type Puppeteer from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
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
): TE.TaskEither<AppError, { browser: Puppeteer.Browser }> => {
  return TE.tryCatch(async () => {
    const browser = await pie.connect(app, puppeteer as any);

    return { browser };
  }, toAppError);
};
