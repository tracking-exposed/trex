import { AppError, toAppError } from '@shared/errors/AppError';
import { Logger } from '@shared/logger';
import { ComparisonDirective } from '@shared/models/Directive';
import { AppEnv } from 'AppEnv';
import { app, BrowserView, dialog, ipcMain, shell } from 'electron';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import * as puppeteer from 'puppeteer-core';
import * as pie from 'puppeteer-in-electron';
import {
  getConfig,
  getConfigPlatformKey,
  getPlatformConfig,
  setConfig,
} from '../../guardoni/config';
import {
  GetGuardoni,
  Guardoni,
  readCSVAndParse,
} from '../../guardoni/guardoni';
import {
  GuardoniConfig,
  GuardoniPlatformConfig,
  Platform,
} from '../../guardoni/types';
import { guardoniLogger } from '../../logger';
import { EVENTS } from '../models/events';
import store from '../store';
import { getEventsLogger } from './event.logger';
import * as path from 'path';
import { getProfileDataDir } from '../../guardoni/profile';

const guardoniEventsLogger = guardoniLogger.extend('events');

export interface Events {
  postMessageL: <T>(
    name: string
  ) => (te: TE.TaskEither<AppError, T>) => Promise<void>;
  unregister: () => void;
  register: (
    basePath: string,
    platform: Platform,
    confOverride: Partial<GuardoniConfig>
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
  let guardoni: Guardoni;
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
    platform: Platform,
    config: Partial<GuardoniConfig>
  ): TE.TaskEither<Error, void> => {
    unregister();

    logger.info('Register events on ipcMain');

    const initGuardoni = (
      basePath: string,
      config: GuardoniConfig,
      platform: Platform
    ): TE.TaskEither<AppError, Guardoni> => {
      guardoniEventsLogger.info(
        'Init guardoni with config %O for platform %s',
        config,
        platform
      );

      return pipe(
        GetGuardoni({
          basePath,
          logger,
          puppeteer,
        }).launch(config, platform),
        TE.chain((g) => {
          guardoni = g;
          app.setPath(
            'userData',
            getProfileDataDir(
              guardoni.config.basePath,
              guardoni.config.profileName
            )
          );

          return TE.right(guardoni);
        })
      );
    };

    return pipe(
      getConfig({ logger })(basePath, platform, config),
      TE.chain((c) => initGuardoni(basePath, c, platform)),
      TE.chain((guardoni) => {
        logger.info('Started guardoni %O', guardoni.config);

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
            TE.right({ config: guardoni.config, platform: guardoni.platform }),
            liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)
          );
        });
        // set guardoni config
        ipcMain.on(EVENTS.SET_GUARDONI_CONFIG_EVENT.value, (event, ...args) => {
          const [config] = args;
          logger.debug(`Update guardoni config %O`, config);

          store.set('basePath', config.basePath);
          const oldProfile = store.get('profile');

          void pipe(
            setConfig(config.basePath, config),
            TE.chain(() => initGuardoni(basePath, config, platform)),
            TE.map((g) => {
              if (oldProfile !== g.config.profileName) {
                store.set('profileName', g.config.profileName);
                app.relaunch();
                app.quit();
              }
            })
          )();
        });

        // create guardoni experiment
        ipcMain.on(EVENTS.CREATE_EXPERIMENT_EVENT.value, (event, ...args) => {
          guardoniEventsLogger.debug('Create experiment with payload %O', args);

          const [configOverride, records] = args;

          void pipe(
            GetGuardoni({
              basePath,
              logger,
              puppeteer,
            }).run(
              {
                ...config,
                ...configOverride,
              },
              configOverride.platform.name
            ),
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
              { ...guardoni.config, ...configOverride }
            );

            const view = mainWindow.getBrowserView() as BrowserView;

            // we may need to update the guardoni config right before the execution
            // guardoni.config = configOverride;

            void pipe(
              TE.right(guardoni),
              TE.chain((g) =>
                pipe(
                  TE.tryCatch(async () => {
                    // todo:
                    // patch the extension manifest permissions
                    // to allow the custom backend before loading the extension

                    const extension =
                      await view.webContents.session.loadExtension(
                        g.platform.extensionDir
                      );

                    logger.debug(
                      'Extension loaded %O from %s',
                      extension,
                      g.platform.extensionDir
                    );

                    return pie.getPage(browser, view, true);
                  }, toAppError),
                  TE.chain((page) => {
                    logger.info(
                      'Profile loaded from %s',
                      app.getPath('userData')
                    );
                    logger.info('Run experiment with config %O', g.config);
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
              guardoni.API.v3.Public.GetPublicDirectives(),
              liftEventTask(EVENTS.GET_PUBLIC_DIRECTIVES.value)
            );
          }
        });

        // get experiment
        ipcMain.on(EVENTS.GET_PUBLIC_DIRECTIVE.value, (event, experimentId) => {
          logger.debug(EVENTS.GET_PUBLIC_DIRECTIVE.value);
          if (!event.sender.isDestroyed()) {
            void pipe(
              guardoni.API.v3.Public.GetPublicDirectives(),
              TE.map((directives) =>
                directives.find((d) => d.experimentId === experimentId)
              ),
              liftEventTask(EVENTS.GET_PUBLIC_DIRECTIVE.value)
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
                  shell.showItemInFolder(path.join(config, 'guardoni.json'))
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
        ipcMain.on(EVENTS.CHANGE_PLATFORM_EVENT.value, (event, platform) => {
          guardoniEventsLogger.info(
            EVENTS.CHANGE_PLATFORM_EVENT.value,
            platform
          );

          guardoniEventsLogger.info('Change platform event %O', platform);
          // clear config in renderer

          // update platform in store
          store.set('platform', platform);
          // call register with new params
          const platformKey = getConfigPlatformKey(platform);
          const platformConfig = getPlatformConfig(platform, guardoni.config);

          const c = {
            ...guardoni.config,
            [platformKey]: {
              ...platformConfig,
            },
          };

          void initGuardoni(basePath, c, platform);
        });

        return TE.tryCatch(
          () =>
            liftEventTask(EVENTS.GET_GUARDONI_CONFIG_EVENT.value)(
              TE.right({ config: guardoni.config, platform: guardoni.platform })
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
