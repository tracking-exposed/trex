import * as remote from '@electron/remote/main';
import { AppError, toAppError } from '@shared/errors/AppError';
import debug from 'debug';
import * as dotenv from 'dotenv';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import unhandled from 'electron-unhandled';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { getProfileDataDir } from '../guardoni/profile';
import { failure } from 'io-ts/lib/PathReporter';
import os from 'os';
import * as path from 'path';
import pie from 'puppeteer-in-electron';
import { AppEnv } from '../AppEnv';
import { DEFAULT_BASE_PATH } from '../guardoni/constants';
import { getPackageVersion } from '../guardoni/utils';
import { GetEvents } from './events/renderer.events';
import store from './store';
import { createGuardoniWindow } from './windows/GuardoniWindow';

app.setPath('userData', path.resolve(os.homedir(), `.guardoni/electron/data`));
app.setAppLogsPath(path.resolve(os.homedir(), `.guardoni/electron/logs`));

// load env from .env file shipped with compiled code
const dotenvPath = path.join(
  __dirname,
  process.env.DOTENV_CONFIG_PATH ?? '.env'
);

dotenv.config({
  path: dotenvPath,
});

let mainWindow: BrowserWindow | null = null;

const mainWindowHTML = `file://${path.join(
  __dirname,
  'renderer/guardoni.html'
)}`;

unhandled();

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

    remote.enable(mainWindow.webContents);

    await mainWindow.loadURL(mainWindowHTML);

    if (env.NODE_ENV !== 'production') {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function () {
      mainWindow = null;
    });
    return mainWindow;
  }, toAppError);
};

export const run = async (): Promise<void> => {
  debug.enable('@trex:*,guardoni:*');

  log.info('Guardoni start', process.cwd());

  // In the main process:
  remote.initialize();
  // unhandled();

  return pipe(
    AppEnv.decode({ VERSION: getPackageVersion(), ...process.env }),
    E.mapLeft((e) => {
      return new AppError('EnvError', 'process.env is malformed', failure(e));
    }),
    TE.fromEither,
    TE.map((env) => {
      log.debug('Loaded env %O', env);
      return env;
    }),
    TE.chain((env) => {
      const platform = store.get('platform', 'youtube');
      const basePath = store.get('basePath', DEFAULT_BASE_PATH);
      const profileName = store.get('profileName', 'default');
      app.setPath('userData', getProfileDataDir(basePath, profileName));
      return pipe(
        TE.tryCatch(() => pie.initialize(app), toAppError),
        TE.chain(() => TE.tryCatch(() => app.whenReady(), toAppError)),
        TE.map(() => ({
          app,
          env,
          platform,
          basePath,
          profileName,
        }))
      );
    }),
    TE.chain(({ app, env, platform, basePath }) => {
      return pipe(
        creatMainWindow(env),
        TE.chain((w) =>
          sequenceS(TE.ApplicativePar)({
            guardoniApp: createGuardoniWindow(app, w),
            mainWindow: TE.right(w),
          })
        ),
        TE.chain(({ guardoniApp, mainWindow }) => {
          const rendererEvents = GetEvents({
            env,
            mainWindow,
            browser: guardoniApp.browser,
          });

          return rendererEvents.register(basePath, platform, {
            headless: false,
            verbose: false,
          });
        })
      );
    }),
    TE.fold(
      (e) => {
        log.error('An error occurred', e);
        return () => Promise.reject(e);
      },
      () => {
        return () => {
          log.info('Main bootstrapped!');
          return Promise.resolve(undefined);
        };
      }
    )
  )();
};

// eslint-disable-next-line no-console
void run().catch(console.error);
