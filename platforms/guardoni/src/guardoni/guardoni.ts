/**
 *
 * Guardoni V2
 *
 * TODO:
 * - filter the directive with "exclude url tag"
 *
 */
import { AppError, toAppError } from '@shared/errors/AppError';
import { Step } from '@shared/models/Step';
import { APIClient, MakeAPIClient } from '@shared/providers/api.provider';
import {
  GetPuppeteer,
  OperateResult
} from '@shared/providers/puppeteer/puppeteer.provider';
import * as Endpoints from '@yttrex/shared/endpoints';
import { differenceInSeconds } from 'date-fns';
import debug from 'debug';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import type puppeteer from 'puppeteer-core';
import { PuppeteerExtra } from 'puppeteer-extra';
import { dispatchBrowser } from './browser';
import { GuardoniCommandOpts, GuardoniNavigateOpts } from './cli';
import {
  checkConfig,
  getConfig,
  getDefaultConfig,
  getPlatformConfig
} from './config';
import {
  getDirective,
  listExperiments,
  registerCSV,
  registerExperiment,
  saveExperiment,
  validateNonEmptyString
} from './experiment';
import {
  cleanExtension, downloadExtension,
  setLocalSettings
} from './extension';
import {
  checkProfile,
  getDefaultProfile,
  getProfileJsonPath,
  readProfile,
  updateGuardoniProfile
} from './profile';
import { GetTKHooks } from './steps/tk.steps';
import { GetYTHooks } from './steps/yt.steps';
import {
  ExperimentInfo,
  GuardoniConfig,
  GuardoniContext,
  GuardoniSuccessOutput,
  Platform,
  PlatformConfig,
  ProgressDetails
} from './types';
import { getChromePath, getPackageVersion } from './utils';

const runNavigate =
  (ctx: GuardoniContext) =>
  (opts?: GuardoniNavigateOpts): TE.TaskEither<AppError, void> => {
    ctx.logger.debug('Running navigate with opts %O', opts);

    const home =
      ctx.platform.name === 'tiktok'
        ? 'https://www.tiktok.com'
        : 'https://www.youtube.com';

    return pipe(
      downloadExtension(ctx),
      TE.map(() =>
        setLocalSettings(ctx)({
          publicKey: opts?.publicKey,
          secretKey: opts?.secretKey,
          researchTag: opts?.researchTag,
          experimentId: opts?.experimentId,
        })
      ),
      TE.chain(() =>
        dispatchBrowser(ctx)({
          headless: false,
        })
      ),
      TE.chain((b) => {
        return TE.tryCatch(async () => {
          const [page] = await b.pages();

          await page.goto(home, {
            waitUntil: 'networkidle0',
            // disable timeout
            timeout: 0,
          });

          await page.waitForTimeout(2000);

          if (ctx.hooks.customs.cookieModal) {
            await ctx.hooks.customs
              .cookieModal(page, {
                action: 'reject',
              })
              .then(
                () => ctx.logger.info('Cookie modal rejected'),
                (e: any) => {
                  ctx.logger.error(
                    'Error during cookie modal rejection: \n %O',
                    e
                  );
                }
              );
          }

          return b;
        }, toAppError);
      }),
      TE.chain((b) => {
        return TE.tryCatch(
          async () =>
            new Promise((resolve, reject) => {
              ctx.logger.info('Browser is ready at %s', home);
              b.on('error', (e) => {
                ctx.logger.error('Error occurred during browsing %O', e);
                resolve();
              });
              b.on('disconnected', () => {
                ctx.logger.debug('Browser disconnected');
                resolve();
              });
              b.on('close', () => {
                ctx.logger.info('browser closing...');
                resolve();
              });

              if (opts?.exit) {
                void b.close().then(resolve).catch(reject);
              }
            }),
          toAppError
        );
      })
    );
  };

export const runBrowser =
  (ctx: GuardoniContext) =>
  (
    experiment: ExperimentInfo,
    steps: NonEmptyArray<Step>,
    opts?: GuardoniCommandOpts
  ): TE.TaskEither<AppError, ExperimentInfo & { publicKey: string | null }> => {
    return pipe(
      downloadExtension(ctx),
      TE.chain(() => dispatchBrowser(ctx)({})),
      TE.chain((browser) => {
        return TE.tryCatch(async () => {
          const [page, ...otherPages] = await browser.pages();

          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          otherPages.forEach(async (p): Promise<void> => {
            ctx.logger.debug("Closing a tab that shouldn't be there!");
            await p.close();
          });
          return page;
        }, toAppError);
      }),
      TE.chain((page) =>
        guardoniExecution(ctx)(experiment.experimentId, steps, page)
      ),
      TE.map((output) => ({
        ...experiment,
        ...output,
        publicKey: output.publicKey ?? opts?.publicKey,
      }))
    );
  };

export const runExperiment =
  (ctx: GuardoniContext) =>
  (
    experimentId: string,
    opts?: GuardoniCommandOpts
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    ctx.logger.info(
      'Running experiment %s with config %O',
      experimentId,
      ctx.config
    );
    return pipe(
      TE.fromEither(validateNonEmptyString(experimentId)),
      TE.chainFirst(() => downloadExtension(ctx)),
      TE.chain((expId) =>
        sequenceS(TE.ApplicativePar)({
          profile: updateGuardoniProfile(ctx)(
            ctx.profile,
            ctx.config.researchTag
          ),
          expId: TE.right(expId),
          localSettings: TE.right(
            setLocalSettings(ctx)({ ...opts, experimentId, active: true })
          ),
        })
      ),
      TE.chain(({ profile, expId }) =>
        pipe(
          getDirective(ctx)(expId),
          TE.chain((data) => {
            return pipe(
              saveExperiment(ctx)(expId, profile),
              TE.chain((exp) => runBrowser(ctx)(exp, data, opts)),
              TE.chainFirst(() =>
                TE.right(
                  setLocalSettings(ctx)({
                    active: true,
                    publicKey: undefined,
                    secretKey: undefined,
                    experimentId: undefined,
                    researchTag: undefined,
                  })
                )
              )
            );
          })
        )
      ),
      TE.map((result) => ({
        type: 'success',
        message: 'Experiment completed',
        values: [result],
      }))
    );
  };

export const runExperimentForPage =
  (ctx: GuardoniContext) =>
  (
    page: puppeteer.Page,
    experimentId: NonEmptyString,
    onProgress?: (details: ProgressDetails) => void
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> =>
    pipe(
      getDirective(ctx)(experimentId),
      TE.chainFirst(() => downloadExtension(ctx)),
      TE.chain((data) => guardoniExecution(ctx)(experimentId, data, page)),
      TE.map((publicKey) => ({
        type: 'success',
        message: 'Experiment completed',
        values: [
          {
            experimentId,
            publicKey,
          },
        ],
      }))
    );

export const runAuto =
  (ctx: GuardoniContext) =>
  (value: '1' | '2'): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    const experimentId: NonEmptyString =
      value === '2'
        ? ('d75f9eaf465d2cd555de65eaf61a770c82d59451' as any)
        : ('37384a9b7dff26184cdea226ad5666ca8cbbf456' as any);

    ctx.logger.debug('Run in auto mode with experiment %s', experimentId);

    return runExperiment(ctx)(experimentId);
  };

export const guardoniExecution =
  (ctx: GuardoniContext) =>
  (
    experiment: string,
    steps: NonEmptyArray<Step>,
    page: puppeteer.Page
  ): TE.TaskEither<AppError, OperateResult> => {
    const start = new Date();

    ctx.logger.debug(`Running experiment %s for directive %s`, experiment);

    ctx.logger.debug('Experiment data %O', steps);
    ctx.logger.debug('Config %O', ctx.config);
    ctx.logger.debug('Platform %O', ctx.platform);

    return pipe(
      ctx.puppeteer.operateBrowser(page, steps),
      TE.map((output) => {
        const publicKey = output.publicKey ?? ctx.config.publicKey;
        const duration = differenceInSeconds(new Date(), start);

        ctx.logger.debug(
          `Operations completed in %ds: check results at `,
          duration,
          `${ctx.platform.frontend}/experiments/render/#${experiment}`
        );
        ctx.logger.debug(
          `Personal log at ${ctx.platform.frontend}/personal/#${publicKey}`
        );

        return { ...output, publicKey };
      })
    );
  };

const loadContext = (
  p: PuppeteerExtra,
  basePath: string,
  cnf: GuardoniConfig,
  platform: Platform,
  logger: GuardoniContext['logger']
): TE.TaskEither<AppError, GuardoniContext> => {
  logger.debug('Loading context for platform %s with config %O', platform, cnf);

  const defaultConfig = getDefaultConfig(basePath);
  const config = checkConfig({ logger })(basePath, {
    ...defaultConfig,
    ...cnf,
    yt: {
      ...defaultConfig.yt,
      ...cnf.yt,
    },
    tk: {
      ...defaultConfig.tk,
      ...cnf.tk,
    },
  }) as GuardoniConfig;
  logger.debug('Config %O', config);

  const profile = getDefaultProfile(basePath, cnf.profileName);
  logger.debug('profile %O', profile);

  const platformConf = getPlatformConfig(platform, config);

  logger.debug('Platform config %O', platformConf);

  return pipe(
    checkProfile({ logger })(basePath, cnf),
    TE.chain((p) => readProfile({ logger })(getProfileJsonPath(p))),
    TE.chain((profile) => {
      const hooks =
        platform === 'youtube'
          ? GetYTHooks({
              profile,
              logger,
            })
          : GetTKHooks({
              profile,
            });

      return pipe(
        getChromePath(),
        E.map((chromePath) => ({
          ...config,
          chromePath,
        })),
        E.map((c) => ({
          hooks,
          puppeteer: GetPuppeteer({
            logger,
            puppeteer: p,
            config: {
              loadFor: config.loadFor,
            },
            hooks,
          }),
          API: MakeAPIClient(
            {
              baseURL: platformConf.backend,
              getAuth: async (req) => req,
              onUnauthorized: async (res) => res,
            },
            Endpoints
          ).API,
          config: {
            ...c,
            basePath,
            profileName: profile.profileName,
          },
          profile,
          logger,
          guardoniConfigFile: getProfileJsonPath(profile),
          version: getPackageVersion(),
          platform: platformConf,
        })),
        E.mapLeft(toAppError),
        TE.fromEither
      );
    })
  );
};

export interface Guardoni {
  version: string;
  config: GuardoniConfig;
  platform: PlatformConfig;
  API: APIClient<typeof Endpoints>;
  // register an experiment from the given csv file
  registerExperimentFromCSV: (
    file: NonEmptyString
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  registerExperiment: (
    records: NonEmptyArray<Step>
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  listExperiments: () => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperiment: (
    experiment: NonEmptyString,
    opts?: GuardoniCommandOpts
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runAuto: (value: '1' | '2') => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperimentForPage: (
    page: puppeteer.Page,
    experiment: NonEmptyString,
    onProgress?: (details: ProgressDetails) => void
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runNavigate: (opts?: GuardoniCommandOpts) => TE.TaskEither<AppError, void>;
  /**
   * Clean the extension directory
   */
  cleanExtension: () => TE.TaskEither<AppError, void>;
}

interface GuardoniLauncher {
  launch: (
    config: Partial<GuardoniConfig>,
    platform: Platform
  ) => TE.TaskEither<AppError, Guardoni>;
  run: (
    config: GuardoniConfig,
    platform: Platform
  ) => TE.TaskEither<AppError, Guardoni>;
}

export interface GuardoniOptions {
  basePath: string;
  logger: GuardoniContext['logger'];
  puppeteer: PuppeteerExtra;
  verbose?: boolean;
}

/**
 * Get Guardoni instance
 */
export type GetGuardoni = (opts: GuardoniOptions) => GuardoniLauncher;

export const GetGuardoni: GetGuardoni = ({
  basePath,
  logger,
  puppeteer,
  verbose,
}) => {
  const loggerSpaces = verbose
    ? ['guardoni*', '@trex*', process.env.DEBUG]
    : ['guardoni:info', 'guardoni:warn', 'guardoni:error', process.env.DEBUG];

  debug.enable(loggerSpaces.join(','));

  return {
    launch: (config, platform) => {
      return pipe(
        getConfig({ logger })(basePath, platform, config),
        TE.chain((cnf) =>
          loadContext(puppeteer, basePath, cnf, platform, logger)
        ),
        TE.map((ctx) => {
          return {
            version: ctx.version,
            config: ctx.config,
            platform: ctx.platform,
            API: ctx.API,
            runAuto: runAuto(ctx),
            runExperiment: runExperiment(ctx),
            runExperimentForPage: runExperimentForPage(ctx),
            registerExperiment: registerExperiment(ctx),
            registerExperimentFromCSV: registerCSV(ctx),
            listExperiments: listExperiments(ctx),
            runNavigate: runNavigate(ctx),
            cleanExtension: cleanExtension(ctx),
          };
        })
      );
    },
    run: (conf, platform) => {
      return pipe(
        loadContext(puppeteer, basePath, conf, platform, logger),
        TE.map((ctx) => {
          return {
            version: ctx.version,
            config: ctx.config,
            platform: ctx.platform,
            API: ctx.API,
            registerExperiment: registerExperiment(ctx),
            registerExperimentFromCSV: registerCSV(ctx),
            listExperiments: listExperiments(ctx),
            runNavigate: runNavigate(ctx),
            runAuto: runAuto(ctx),
            runExperiment: runExperiment(ctx),
            runExperimentForPage: runExperimentForPage(ctx),
            cleanExtension: cleanExtension(ctx),
          };
        })
      );
    },
  };
};
