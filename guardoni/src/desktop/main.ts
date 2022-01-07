import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import pie from 'puppeteer-in-electron';
import * as guardoni from '../guardoni';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { sequenceS } from 'fp-ts/lib/Apply';
import log from 'electron-log';
import { v4 as uuid } from 'uuid';

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

    mainWindow.webContents.openDevTools();
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
  app.setPath('userData', path.resolve(process.cwd(), 'data'));

  await pie.initialize(app);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.on('ready', async () => {
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
                  async (event, args: guardoni.Config): Promise<void> => {
                    const {
                      profileId: profile,
                      evidenceTag,
                      experiment,
                    } = args;

                    if (guardoniApp.window.isDestroyed()) {
                      mainWindow.webContents.postMessage('guardoniOutput', {
                        message:
                          'Guardoni window has been destroyed, creating it...',
                      });

                      const result = await createGuardoniWindow(
                        app,
                        mainWindow
                      )();
                      if (result._tag === 'Left') {
                        return reject(
                          new Error('Cant initialized guardoni window')
                        );
                      }
                      guardoniApp = result.right;
                    }

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

                    const profileData = await guardoni.profileExecount(
                      profile,
                      evidenceTag
                    );

                    mainWindow.webContents.postMessage('guardoniOutput', {
                      message: 'Guardoni window has been destroyed',
                      details: [profileData.profileName, profileData.udd],
                    });

                    const directivesURL = guardoni.buildAPIurl(
                      'directives',
                      experiment
                    );

                    const directives = await guardoni.pullDirectives(
                      directivesURL
                    );

                    mainWindow.webContents.postMessage('guardoniOutput', {
                      id: uuid(),
                      message: 'Directives created',
                      details: directives.map((d) => d.name),
                    });

                    guardoniApp.window.show();

                    const page = await pie.getPage(
                      guardoniApp.browser,
                      guardoniApp.window
                    );
                    await guardoni.guardoniExecution(
                      experiment,
                      directives,
                      page,
                      profileData
                    );

                    return resolve(undefined);
                  }
                );
              }),
            E.toError
          ),
          TE.mapLeft((e) => {
            log.error('An error occured ', e);
            mainWindow.webContents.postMessage('guardoniError', e);
            return e;
          })
        );
      })
    )();

    // return undefined;
  });
};

// eslint-disable-next-line no-console
void run().catch(console.error);
