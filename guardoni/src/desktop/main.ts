import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import os from 'os';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import pie from 'puppeteer-in-electron';
import { v4 as uuid } from 'uuid';
import { GetGuardoni } from '../guardoni/guardoni';
import { GuardoniConfig } from '../guardoni/types';

let mainWindow: BrowserWindow | null = null;

const mainWindowHTML = `file://${path.join(
  __dirname,
  'renderer/guardoni.html'
)}`;

const creatMainWindow = (): TE.TaskEither<Error, BrowserWindow> => {
  return TE.tryCatch(async () => {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      fullscreenable: false,
      resizable: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    await mainWindow.loadURL(mainWindowHTML);

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function () {
      mainWindow = null;
    });
    return mainWindow;
  }, E.toError);
};

const createGuardoniWindow = (
  app: Electron.App,
  parentWindow: BrowserWindow
): TE.TaskEither<
  Error,
  { browser: puppeteer.Browser; window: BrowserWindow }
> => {
  return TE.tryCatch(async () => {
    const browser = await pie.connect(app, puppeteer);

    const window = new BrowserWindow({
      show: false,
      parent: parentWindow,
    });

    return { browser, window };
  }, E.toError);
};

export const run = async (): Promise<void> => {
  log.info('Guardoni start', process.cwd());

  app.setPath('userData', path.resolve(os.homedir(), `.config/guardoni/data`));

  return pipe(
    TE.tryCatch(() => pie.initialize(app), E.toError),
    TE.chain(() => TE.tryCatch(() => app.whenReady(), E.toError)),
    TE.map(() => ({ app })),
    TE.chain(({ app }) => {
      return pipe(
        creatMainWindow(),
        TE.chain((win) =>
          sequenceS(TE.ApplicativePar)({
            guardoniApp: createGuardoniWindow(app, win),
            mainWindow: TE.right(win),
          })
        ),
        TE.chain(({ guardoniApp, mainWindow }) => {
          return pipe(
            TE.tryCatch(
              () =>
                new Promise((resolve, reject) => {
                  ipcMain.on(
                    'startGuardoni',
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    async (event, args: GuardoniConfig): Promise<void> => {
                      const {
                        profile,
                        evidenceTag,
                        // experiment,
                      } = args;

                      const experiment = '';

                      // if (guardoniApp.window.isDestroyed()) {
                      //   mainWindow.webContents.postMessage('guardoniOutput', {
                      //     message:
                      //       'Guardoni window has been destroyed, creating it...',
                      //   });

                      //   const result = await createGuardoniWindow(
                      //     app,
                      //     mainWindow
                      //   )();
                      //   if (result._tag === 'Left') {
                      //     return reject(
                      //       new Error('Cant initialized guardoni window')
                      //     );
                      //   }
                      //   guardoniApp = result.right;
                      // }

                      const extension =
                        await guardoniApp.window.webContents.session.loadExtension(
                          path.join(__dirname, '../extension')
                        );

                      mainWindow.webContents.postMessage('guardoniOutput', {
                        message: 'Extension loaded',
                        details: extension,
                      });

                      guardoniApp.window.on('close', () => {
                        const closeError = new Error(
                          'Guardoni window closed before execution finished'
                        );
                        reject(closeError);
                      });

                      // eslint-disable-next-line no-console
                      log.info('Starting guardoni with', {
                        profile,
                        evidenceTag,
                      });

                      const page = await pie.getPage(
                        guardoniApp.browser,
                        guardoniApp.window
                      );

                      const guardoni = GetGuardoni({
                        profile,
                        evidenceTag,
                        headless: false,
                        verbose: true,
                      });

                      return pipe(
                        TE.right(guardoni),
                        TE.chain((g) => {
                          guardoniApp.window.show();

                          return g.runExperimentForPage(
                            page,
                            experiment,
                            (progress) => {
                              mainWindow.webContents.postMessage(
                                'guardoniOutput',
                                {
                                  id: uuid(),
                                  ...progress,
                                }
                              );
                            }
                          );
                        }),
                        // eslint-disable-next-line array-callback-return
                        TE.map(() => {
                          guardoniApp.window.close();
                        })
                      )()
                        .then(resolve)
                        .catch(reject);
                    }
                  );
                }),
              E.toError
            ),
            TE.mapLeft((e) => {
              log.error('An error occurred ', e);
              mainWindow.webContents.postMessage('guardoniError', e);
              return e;
            })
          );
        })
      );
    }),
    TE.fold(
      (e) => {
        log.error('An error occurred ', e);
        return () => Promise.resolve(undefined);
      },
      () => {
        return () => Promise.resolve(undefined);
      }
    )
  )();
};

// eslint-disable-next-line no-console
void run().catch(console.error);
