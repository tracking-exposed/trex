import { AppError, toAppError } from '@shared/errors/AppError';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { failure } from 'io-ts/lib/PathReporter';
import os from 'os';
import * as path from 'path';
import pie from 'puppeteer-in-electron';
import { AppEnv } from '../AppEnv';
import { GetEvents } from './events/renderer.events';
import { createGuardoniWindow } from './windows/GuardoniWindow';
import * as dotenv from 'dotenv';
import { GetAPI } from '@shared/providers/api.provider';
import debug from 'debug';

// load env from .env file shipped with compiled code
dotenv.config({
  path: path.join(__dirname, '.env'),
});

let mainWindow: BrowserWindow | null = null;

const mainWindowHTML = `file://${path.join(
  __dirname,
  'renderer/guardoni.html'
)}`;

const creatMainWindow = (
  env: AppEnv
): TE.TaskEither<AppError, BrowserWindow> => {
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

    if (env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function () {
      mainWindow = null;
    });
    return mainWindow;
  }, toAppError);
};

export const run = async (): Promise<void> => {
  debug.enable('guardoni:*');
  log.info('Guardoni start', process.cwd());

  app.setPath('userData', path.resolve(os.homedir(), `.config/guardoni/data`));

  return pipe(
    AppEnv.decode(process.env),
    E.mapLeft((e) => {
      return new AppError('EnvError', 'process.env is malformed', failure(e));
    }),
    TE.fromEither,
    TE.map((env) => {
      log.debug('Loaded env %O', env);
      return env;
    }),
    TE.chain((env) =>
      pipe(
        TE.tryCatch(() => pie.initialize(app), toAppError),
        TE.chain(() => TE.tryCatch(() => app.whenReady(), toAppError)),
        TE.map(() => ({ app, env }))
      )
    ),
    TE.chain(({ app, env }) => {
      return pipe(
        creatMainWindow(env),
        TE.chain((w) =>
          sequenceS(TE.ApplicativePar)({
            guardoniApp: createGuardoniWindow(app, w),
            mainWindow: TE.right(w),
          })
        ),
        TE.map(({ guardoniApp, mainWindow }) => {
          // bind events for main window
          GetEvents({
            app,
            env,
            api: GetAPI({ baseURL: env.BACKEND }).API,
            mainWindow,
            guardoniWindow: guardoniApp.window,
            guardoniBrowser: guardoniApp.browser,
          }).register();
        })
      );
    }),
    TE.fold(
      (e) => {
        log.error('An error occurred', e);
        return () => Promise.reject(e);
      },
      () => {
        return () => Promise.resolve(undefined);
      }
    )
  )();
};

// eslint-disable-next-line no-console
void run().catch(console.error);
