import { AppError, toAppError } from '@shared/errors/AppError';
import { ComparisonDirective } from '@shared/models/Directive';
import { dialog, ipcMain } from 'electron';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import * as puppeteer from 'puppeteer-core';
import * as pie from 'puppeteer-in-electron';
import { v4 as uuid } from 'uuid';
import { GetGuardoni, readCSVAndParse } from '../../guardoni/guardoni';
import { GuardoniConfigRequired } from '../../guardoni/types';
import { guardoniLogger } from '../../logger';
import {
  CREATE_EXPERIMENT_EVENT,
  EVENTS,
  GET_GUARDONI_CONFIG_EVENT,
  GLOBAL_ERROR_EVENT,
  GUARDONI_OUTPUT_EVENT,
  PICK_CSV_FILE_EVENT,
  RUN_GUARDONI_EVENT,
} from '../models/events';
import { OutputItem } from '../OutputPanel';
import { createGuardoniWindow } from '../windows/GuardoniWindow';

const guardoniEventsLogger = guardoniLogger.extend('events');

export interface Events {
  register: () => void;
}

const sendMessage =
  (w: Electron.BrowserWindow) => (channel: EVENTS, event: OutputItem) => {
    w.webContents.postMessage(channel, event);
  };

const pickCSVFile = (): TE.TaskEither<
  AppError,
  { path: string; parsed: ComparisonDirective[] }
> => {
  return pipe(
    TE.tryCatch(
      () =>
        dialog.showOpenDialog({
          properties: ['openFile'],
          defaultPath: process.cwd(),
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        }),
      toAppError
    ),
    TE.chain((value) => {
      return pipe(
        readCSVAndParse(value.filePaths[0], 'comparison'),
        TE.map((parsed) => ({ path: value.filePaths[0], parsed }))
      );
    })
  );
};

const GetEventListenerLifter =
  (
    mainWindow: Electron.BrowserWindow,
    guardoniWindow: Electron.BrowserWindow
  ) =>
  <T>(name: string) =>
  (te: TE.TaskEither<AppError, T>): Promise<void> => {
    return pipe(
      te,
      TE.fold(
        (e) => () => {
          guardoniWindow.close();
          mainWindow.webContents.postMessage(GLOBAL_ERROR_EVENT.value, e);
          return Promise.resolve();
        },
        (result) => () => {
          mainWindow.webContents.postMessage(name, result);
          return Promise.resolve();
        }
      )
    )();
  };

interface GetEventsContext {
  app: Electron.App;
  mainWindow: Electron.BrowserWindow;
  guardoniWindow: Electron.BrowserWindow;
  guardoniBrowser: puppeteer.Browser;
}

export const GetEvents = ({
  app,
  mainWindow,
  guardoniWindow,
  guardoniBrowser,
}: GetEventsContext): Events => {
  const sMessage = sendMessage(mainWindow);

  return {
    register: () => {
      const liftEventTask = GetEventListenerLifter(mainWindow, guardoniWindow);
      // pick csv file
      ipcMain.on(PICK_CSV_FILE_EVENT.value, () => {
        void pipe(pickCSVFile(), liftEventTask(PICK_CSV_FILE_EVENT.value));
      });

      // get guardoni config
      ipcMain.on(GET_GUARDONI_CONFIG_EVENT.value, (event, ...args) => {
        guardoniEventsLogger.debug(
          `Event %s with payload %O`,
          GET_GUARDONI_CONFIG_EVENT.value,
          args
        );

        void pipe(
          TE.right(GetGuardoni({ verbose: false, headless: true }).config),
          liftEventTask(GET_GUARDONI_CONFIG_EVENT.value)
        );
      });

      // create guardoni experiment
      ipcMain.on(CREATE_EXPERIMENT_EVENT.value, (event, ...args) => {
        guardoniEventsLogger.debug('Create experiment with payload %O', args);

        const [config, records] = args;

        const g = GetGuardoni(config);

        void pipe(
          g.registerExperiment(records, 'comparison'),
          TE.map((e) => {
            sMessage(GUARDONI_OUTPUT_EVENT.value, {
              id: uuid(),
              level: 'Info',
              message: e.message,
              details: e.values,
            });

            return e.values.experimentId;
          }),
          liftEventTask(CREATE_EXPERIMENT_EVENT.value)
        );
      });

      ipcMain.on(
        RUN_GUARDONI_EVENT.value,
        (
          event,
          config: GuardoniConfigRequired,
          experimentId: NonEmptyString
        ) => {
          // eslint-disable-next-line no-console
          guardoniEventsLogger.info(
            'Running experiment %s with config %O',
            experimentId,
            config
          );

          const guardoni = GetGuardoni(config);

          void pipe(
            TE.tryCatch(async () => {
              // guardoniWindow.on('close', () => {
              //   const closeError = new Error(
              //     'Guardoni window closed before execution finished'
              //   );
              //   throw closeError;
              // });

              // recreate guardoni window and browser if window has been destroyed
              if (guardoniWindow.isDestroyed()) {
                const newGuardoniApp = await pipe(
                  createGuardoniWindow(app, mainWindow),
                  TE.fold(
                    (e) => () => Promise.reject(e),
                    (result) => () => Promise.resolve(result)
                  )
                )();

                guardoniWindow = newGuardoniApp.window;
                guardoniBrowser = newGuardoniApp.browser;
              }

              const extension =
                await guardoniWindow.webContents.session.loadExtension(
                  config.extensionDir
                );

              mainWindow.webContents.postMessage('guardoniOutput', {
                message: 'Extension loaded',
                details: extension,
              });

              return pie.getPage(guardoniBrowser, guardoniWindow);
            }, toAppError),
            TE.chain((page) => {
              guardoniWindow.show();

              return guardoni.runExperimentForPage(
                page,
                experimentId,
                (progress) => {
                  mainWindow.webContents.postMessage(
                    GUARDONI_OUTPUT_EVENT.value,
                    {
                      id: uuid(),
                      ...progress,
                    }
                  );
                }
              );
            }),
            liftEventTask(RUN_GUARDONI_EVENT.value)
          );
        }
      );
    },
  };
};
