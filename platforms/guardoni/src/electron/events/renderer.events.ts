import { AppError, toAppError } from '@shared/errors/AppError';
import { Logger } from '@shared/logger';
import { ComparisonDirective } from '@shared/models/Directive';
import { APIClient } from '@shared/providers/api.provider';
import { AppEnv } from 'AppEnv';
import { BrowserView, dialog, ipcMain } from 'electron';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import * as puppeteer from 'puppeteer-core';
import * as pie from 'puppeteer-in-electron';
import { GetGuardoni, readCSVAndParse } from '../../guardoni/guardoni';
import { GuardoniConfig, GuardoniConfigRequired } from '../../guardoni/types';
import { guardoniLogger } from '../../logger';
import { EVENTS } from '../models/events';
// import { createGuardoniWindow } from '../windows/GuardoniWindow';
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
  (mainWindow: Electron.BrowserWindow, logger: Omit<Logger, 'extend'>) =>
  <T>(name: string) =>
  (te: TE.TaskEither<AppError, T>): Promise<void> => {
    return pipe(
      te,
      TE.fold(
        (e) => () => {
          logger.error('Error trigger for %s \n %O', name, e);
          mainWindow.webContents.postMessage(
            EVENTS.GLOBAL_ERROR_EVENT.value,
            e
          );
          return Promise.resolve();
        },
        (result) => () => {
          logger.debug('Dispatching event %s with payload %O', name, result);
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
  browser: puppeteer.Browser;
  config: GuardoniConfig;
}

export const GetEvents = ({
  app,
  api,
  mainWindow,
  browser,
  config,
}: GetEventsContext): Events => {
  const logger = getEventsLogger(mainWindow);

  return {
    register: () => {
      const liftEventTask = GetEventListenerLifter(mainWindow, logger);
      // pick csv file
      ipcMain.on(EVENTS.PICK_CSV_FILE_EVENT.value, () => {
        void pipe(
          pickCSVFile(logger),
          liftEventTask(EVENTS.PICK_CSV_FILE_EVENT.value)
        );
      });

      // get guardoni config
      ipcMain.on(EVENTS.GET_GUARDONI_CONFIG_EVENT.value, (event, ...args) => {
        logger.debug(
          `Event %s with payload %O`,
          EVENTS.GET_GUARDONI_CONFIG_EVENT.value,
          args
        );

        void pipe(
          GetGuardoni({
            config,
            logger,
            puppeteer,
          }),
          TE.map((g) => g.config),
          liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)
        );
      });

      // create guardoni experiment
      ipcMain.on(EVENTS.CREATE_EXPERIMENT_EVENT.value, (event, ...args) => {
        guardoniEventsLogger.debug('Create experiment with payload %O', args);

        const [configOverride, records] = args;

        void pipe(
          GetGuardoni({
            config: {
              ...config,
              ...configOverride,
            },
            logger,
            puppeteer,
          }),
          TE.chain((g) => g.registerExperiment(records, 'comparison')),
          TE.map((e) => {
            logger.info(e.message, e.values);

            return e.values[0].experimentId;
          }),
          liftEventTask(EVENTS.CREATE_EXPERIMENT_EVENT.value)
        );
      });

      ipcMain.on(
        EVENTS.RUN_GUARDONI_EVENT.value,
        (
          event,
          configOverride: GuardoniConfigRequired,
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
                ...config,
                ...configOverride,
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

                  const view = mainWindow.getBrowserView() as BrowserView;
                  // mainWindow.setBrowserView(view);
                  // view.setBounds({ x: 200, y: 100, width: 1000, height: 300 });

                  // recreate guardoni window and browser if window has been destroyed
                  // if (guardoniWindow.isDestroyed()) {
                  //   logger.debug('Guardoni window destroyed, recreating it...');
                  //   const newGuardoniApp = await pipe(
                  //     createGuardoniWindow(app, mainWindow),
                  //     TE.fold(
                  //       (e) => () => Promise.reject(e),
                  //       (result) => () => Promise.resolve(result)
                  //     )
                  //   )();

                  //   guardoniView = newGuardoniApp.view;
                  //   guardoniBrowser = newGuardoniApp.browser;
                  // }

                  const extension =
                    await view.webContents.session.loadExtension(
                      g.config.extensionDir
                    );

                  logger.debug('Extension loaded %O', extension);

                  return pie.getPage(browser, view, true);
                }, toAppError),
                TE.chain((page) => {
                  return g.runExperimentForPage(
                    page,
                    experimentId,
                    (progress) => {
                      logger.info(progress.message, ...progress.details);
                    }
                  );
                })
              )
            ),
            liftEventTask(EVENTS.RUN_GUARDONI_EVENT.value)
          );
        }
      );

      ipcMain.on(EVENTS.GET_PUBLIC_DIRECTIVES.value, () => {
        void pipe(
          api.v3.Public.GetPublicDirectives(),
          liftEventTask(EVENTS.GET_PUBLIC_DIRECTIVES.value)
        );
      });

      ipcMain.on(EVENTS.OPEN_GUARDONI_DIR.value, (event, config: string) => {
        void pipe(
          TE.tryCatch(
            () =>
              dialog.showOpenDialog({
                properties: ['openDirectory'],
                defaultPath: config,
              }),
            toAppError
          ),
          liftEventTask(EVENTS.OPEN_GUARDONI_DIR.value)
        );
      });
    },
  };
};
