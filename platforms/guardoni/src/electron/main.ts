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
import { failure } from 'io-ts/lib/PathReporter';
import os from 'os';
import * as path from 'path';
import pie from 'puppeteer-in-electron';
import { AppEnv } from '../AppEnv';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_TK_EXTENSION_DIR,
  DEFAULT_YT_EXTENSION_DIR,
} from '../guardoni/constants';
import { getConfig } from '../guardoni/guardoni';
import { getPackageVersion } from '../guardoni/utils';
import { GetEvents } from './events/renderer.events';
import store from './store/index';
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
    TE.chain((env) =>
      pipe(
        TE.tryCatch(() => pie.initialize(app), toAppError),
        TE.chain(() => TE.tryCatch(() => app.whenReady(), toAppError)),
        TE.map(() => ({
          app,
          env,
        }))
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
        TE.chain(({ guardoniApp, mainWindow }) => {
          const rendererEvents = GetEvents({
            env,
            mainWindow,
            browser: guardoniApp.browser,
          });

          const platform = store.get('platform', 'youtube');
          const basePath = store.get('basePath', DEFAULT_BASE_PATH);

          log.debug('Last platform %s', platform);

          return pipe(
            getConfig(basePath, platform, {
              headless: false,
              verbose: false,
              yt: {
                name: 'youtube',
                backend: env.YT_BACKEND,
                extensionDir: DEFAULT_YT_EXTENSION_DIR,
              },
              tk: {
                name: 'tiktok',
                backend: env.TK_BACKEND,
                extensionDir: DEFAULT_TK_EXTENSION_DIR,
              },
            }),
            TE.chain((config) => {
              return rendererEvents.register(config, platform);
            })
          );
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
