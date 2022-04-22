import { AppError, toAppError } from '@shared/errors/AppError';
import { Logger } from '@shared/logger';
import { ComparisonDirective } from '@shared/models/Directive';
import { GetAPI } from '@shared/providers/api.provider';
import { AppEnv } from 'AppEnv';
import { BrowserView, dialog, ipcMain, shell } from 'electron';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import * as puppeteer from 'puppeteer-core';
import * as pie from 'puppeteer-in-electron';
import { getConfigPlatformKey, setConfig } from '../../guardoni/config';
import { GetGuardoni, readCSVAndParse } from '../../guardoni/guardoni';
import {
  GuardoniConfig,
  GuardoniPlatformConfig,
  Platform,
} from '../../guardoni/types';
import { guardoniLogger } from '../../logger';
import { EVENTS } from '../models/events';
import store from '../store';
import { getEventsLogger } from './event.logger';

const guardoniEventsLogger = guardoniLogger.extend('events');

export interface Events {
  postMessageL: <T>(
    name: string
  ) => (te: TE.TaskEither<AppError, T>) => Promise<void>;
  unregister: () => void;
  register: (
    basePath: string,
    conf: GuardoniConfig,
    platform: Platform
  ) => TE.TaskEither<Error, void>;
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
  env: AppEnv;
  mainWindow: Electron.BrowserWindow;
  browser: puppeteer.Browser;
}

export const GetEvents = ({
  mainWindow,
  browser,
}: GetEventsContext): Events => {
  const logger = getEventsLogger(mainWindow);

  // unregister all event handlers bound on 'register' invocation
  const unregister = (): void => {
    const allEvents = Object.keys(EVENTS);
    logger.debug('Unregister all events %O', allEvents);
    allEvents.forEach((k) => {
      ipcMain.removeHandler(k);
      ipcMain.removeAllListeners(k);
    });
  };

  const liftEventTask = GetEventListenerLifter(mainWindow, logger);

  // register all events triggered by the UI to ipcMain
  const register = (
    basePath: string,
    config: GuardoniConfig,
    platform: Platform
  ): TE.TaskEither<Error, void> => {
    unregister();

    logger.info('Register events on ipcMain');

    return pipe(
      GetGuardoni({
        basePath,
        config,
        logger,
        puppeteer,
        platform,
      }),
      TE.chain((guardoni) => {
        logger.info('Started guardoni %O', guardoni.config);

        let api = GetAPI({
          baseURL: guardoni.config.platform.backend,
          getAuth: async (req) => req,
          onUnauthorized: async (res) => res,
        }).API;

        const initGuardoni = async (
          basePath: string,
          config: GuardoniConfig,
          platform: Platform
        ): Promise<void> => {
          return pipe(
            setConfig(guardoni.config.basePath, config),
            TE.chain(() =>
              GetGuardoni({
                basePath,
                config,
                platform,
                logger,
                puppeteer,
              })
            )
          )().then((result) => {
            if (result._tag === 'Right') {
              guardoni = result.right;
              api = GetAPI({
                baseURL: guardoni.config.platform.backend,
                getAuth: async (req) => req,
                onUnauthorized: async (res) => res,
              }).API;
              return pipe(
                TE.right(guardoni.config),
                liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)
              );
            } else {
              logger.error("Can't start guardoni %O", result.left);
              return pipe(
                TE.right(result.left),
                liftEventTask(EVENTS.GUARDONI_ERROR_EVENT.value)
              );
            }
          });
        };

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
            TE.right(guardoni.config),
            liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)
          );
        });
        // set guardoni config
        ipcMain.on(EVENTS.SET_GUARDONI_CONFIG_EVENT.value, (event, ...args) => {
          const [{ platform, ...platformConfig }] = args;
          logger.debug(`Update guardoni platform config %O`, platformConfig);

          const platformKey = getConfigPlatformKey(platform);
          const c = {
            ...config,
            ...platformConfig,
            [platformKey]: {
              ...config[platformKey],
              ...platform,
            },
          };

          logger.debug(`Update guardoni config %O`, c);

          store.set('basePath', platformConfig.basePath);

          void TE.tryCatch(
            () =>
              initGuardoni(basePath, { ...platformConfig, platform }, platform),
            toAppError
          )();
        });

        // create guardoni experiment
        ipcMain.on(EVENTS.CREATE_EXPERIMENT_EVENT.value, (event, ...args) => {
          guardoniEventsLogger.debug('Create experiment with payload %O', args);

          const [configOverride, records] = args;

          void pipe(
            GetGuardoni({
              basePath,
              config: {
                ...config,
                ...configOverride,
              },
              platform: configOverride.platform.name,
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
            configOverride: GuardoniPlatformConfig,
            experimentId: NonEmptyString
          ) => {
            // eslint-disable-next-line no-console
            guardoniEventsLogger.info(
              'Running experiment %s with config %O',
              experimentId,
              config
            );

            const view = mainWindow.getBrowserView() as BrowserView;

            // we may need to update the guardoni config right before the execution
            // guardoni.config = configOverride;

            void pipe(
              TE.right(guardoni),
              TE.chain((g) =>
                pipe(
                  TE.tryCatch(async () => {
                    const extension =
                      await view.webContents.session.loadExtension(
                        g.config.platform.extensionDir
                      );

                    logger.debug(
                      'Extension loaded %O from %s',
                      extension,
                      g.config.platform.extensionDir
                    );

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
                  }),
                  TE.map((output) => {
                    mainWindow.removeBrowserView(view);
                    return output;
                  })
                )
              ),
              liftEventTask(EVENTS.RUN_GUARDONI_EVENT.value)
            );
          }
        );

        // list experiments
        ipcMain.on(EVENTS.GET_PUBLIC_DIRECTIVES.value, (event) => {
          logger.debug(EVENTS.GET_PUBLIC_DIRECTIVES.value);
          if (!event.sender.isDestroyed()) {
            void pipe(
              api.v3.Public.GetPublicDirectives(),
              liftEventTask(EVENTS.GET_PUBLIC_DIRECTIVES.value)
            );
          }
        });

        // open guardoni dir
        ipcMain.on(EVENTS.OPEN_GUARDONI_DIR.value, (event, config: string) => {
          guardoniEventsLogger.debug(EVENTS.OPEN_GUARDONI_DIR.value, config);
          void pipe(
            TE.tryCatch(
              () =>
                Promise.resolve(
                  shell.showItemInFolder(`${config}/guardoni.json`)
                ),
              toAppError
            ),
            liftEventTask(EVENTS.OPEN_GUARDONI_DIR.value)
          );
        });

        /**
         * When the platform changes the guardoni instance needs to be
         * relaunched with new configuration
         */
        ipcMain.on(EVENTS.CHANGE_PLATFORM_EVENT.value, (event, ...args) => {
          guardoniEventsLogger.info(EVENTS.CHANGE_PLATFORM_EVENT.value, args);
          const [platform] = args;

          // clear config in renderer

          // update platform in store
          store.set('platform', platform);
          // call register with new params
          void initGuardoni(basePath, config, platform);
        });

        return TE.tryCatch(
          () =>
            liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)(
              TE.right(guardoni.config)
            ),
          toAppError
        );
      })
    );
  };

  return {
    postMessageL: liftEventTask,
    register,
    unregister,
  };
};
