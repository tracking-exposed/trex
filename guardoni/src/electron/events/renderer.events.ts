import { AppError, toAppError } from '@trex/shared/errors/AppError';
import { Logger } from '@trex/shared/logger';
import { ComparisonDirective } from '@trex/shared/models/Directive';
import { APIClient } from '@trex/shared/providers/api.provider';
import { dialog, ipcMain } from 'electron';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import * as puppeteer from 'puppeteer-core';
import * as pie from 'puppeteer-in-electron';
import { AppEnv } from '../../AppEnv';
import { GetGuardoni, readCSVAndParse } from '../../guardoni/guardoni';
import { GuardoniConfig, GuardoniConfigRequired } from '../../guardoni/types';
import { guardoniLogger } from '../../logger';
import {
  CREATE_EXPERIMENT_EVENT,
  GET_GUARDONI_CONFIG_EVENT,
  GET_PUBLIC_DIRECTIVES,
  GLOBAL_ERROR_EVENT,
  PICK_CSV_FILE_EVENT,
  RUN_GUARDONI_EVENT
} from '../models/events';
import { createGuardoniWindow } from '../windows/GuardoniWindow';
import { getEventsLogger } from './event.logger';

const guardoniEventsLogger = guardoniLogger.extend('events');

export interface Events {
  register: () => void;
}

const pickCSVFile = (
  logger: Pick<Logger, 'debug' | 'error' | 'info'>
): TE.TaskEither<AppError, { path: string; parsed: ComparisonDirective[] }> => {
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
        readCSVAndParse(logger)(value.filePaths[0], 'comparison'),
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
  env: AppEnv;
  api: APIClient;
  mainWindow: Electron.BrowserWindow;
  guardoniWindow: Electron.BrowserWindow;
  guardoniBrowser: puppeteer.Browser;
  guardoniConfig: GuardoniConfig;
}

export const GetEvents = ({
  app,
  api,
  mainWindow,
  guardoniWindow,
  guardoniBrowser,
  guardoniConfig,
}: GetEventsContext): Events => {
  const logger = getEventsLogger(mainWindow);

  return {
    register: () => {
      const liftEventTask = GetEventListenerLifter(mainWindow, guardoniWindow);
      // pick csv file
      ipcMain.on(PICK_CSV_FILE_EVENT.value, () => {
        void pipe(
          pickCSVFile(logger),
          liftEventTask(PICK_CSV_FILE_EVENT.value)
        );
      });

      // get guardoni config
      ipcMain.on(GET_GUARDONI_CONFIG_EVENT.value, (event, ...args) => {
        logger.debug(
          `Event %s with payload %O`,
          GET_GUARDONI_CONFIG_EVENT.value,
          args
        );

        void pipe(
          GetGuardoni({
            config: guardoniConfig,
            logger,
            puppeteer,
          }),
          TE.map((g) => g.config),
          liftEventTask(GET_GUARDONI_CONFIG_EVENT.value)
        );
      });

      // create guardoni experiment
      ipcMain.on(CREATE_EXPERIMENT_EVENT.value, (event, ...args) => {
        guardoniEventsLogger.debug('Create experiment with payload %O', args);

        const [config, records] = args;

        void pipe(
          GetGuardoni({
            config: {
              ...guardoniConfig,
              ...config,
            },
            logger,
            puppeteer,
          }),
          TE.chain((g) => g.registerExperiment(records, 'comparison')),
          TE.map((e) => {
            logger.info(e.message, e.values);

            return e.values[0].experimentId;
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

          void pipe(
            GetGuardoni({
              config: {
                ...guardoniConfig,
                ...config,
              },
              logger,
              puppeteer,
            }),
            TE.chain((g) =>
              pipe(
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

                  logger.info('Extension loaded %O', extension);

                  return pie.getPage(guardoniBrowser, guardoniWindow);
                }, toAppError),
                TE.chain((page) => {
                  guardoniWindow.show();

                  return g.runExperimentForPage(
                    page,
                    experimentId,
                    (progress) => {
                      logger.info(progress.message, ...progress.details);
                    }
                  );
                }),
                TE.map(() => {
                  guardoniWindow.close();
                })
              )
            ),
            liftEventTask(RUN_GUARDONI_EVENT.value)
          );
        }
      );

      ipcMain.on(GET_PUBLIC_DIRECTIVES.value, () => {
        void pipe(
          api.v3.Public.GetPublicDirectives(),
          liftEventTask(GET_PUBLIC_DIRECTIVES.value)
        );
      });
    },
  };
};
