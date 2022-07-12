/**
 *
 * Guardoni V2
 *
 * TODO:
 * - filter the directive with "exclude url tag"
 *
 */
import * as Endpoints from '@yttrex/shared/endpoints';
import { AppError, toAppError } from '@shared/errors/AppError';
import { Directive, DirectiveType } from '@shared/models/Directive';
import { APIClient, MakeAPIClient } from '@shared/providers/api.provider';
import { GetPuppeteer } from '@shared/providers/puppeteer/puppeteer.provider';
import { differenceInSeconds } from 'date-fns';
import debug from 'debug';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import path from 'path';
import type puppeteer from 'puppeteer-core';
import { PuppeteerExtra } from 'puppeteer-extra';
import { dispatchBrowser } from './browser';
import {
  checkConfig,
  getConfig,
  getDefaultConfig,
  getPlatformConfig,
} from './config';
import { GetTKHooks } from './directives/tk.directives';
import { GetYTHooks } from './directives/yt.directives';
import {
  getDirective,
  listExperiments,
  registerCSV,
  registerExperiment,
  saveExperiment,
  validateNonEmptyString,
} from './experiment';
import { downloadExtension, setLocalSettings } from './extension';
import {
  checkProfile,
  getDefaultProfile,
  getProfileJsonPath,
  readProfile,
  updateGuardoniProfile,
} from './profile';
import {
  ExperimentInfo,
  GuardoniConfig,
  GuardoniContext,
  GuardoniSuccessOutput,
  Platform,
  PlatformConfig,
  ProgressDetails,
} from './types';
import { getChromePath, getPackageVersion } from './utils';
import { GuardoniCommandOpts } from './cli';

const runNavigate =
  (ctx: GuardoniContext) =>
  (opts?: GuardoniCommandOpts): TE.TaskEither<AppError, void> => {
    const home =
      ctx.platform.name === 'tiktok'
        ? 'https://www.tiktok.com'
        : 'https://www.youtube.com';

    return pipe(
      TE.right(setLocalSettings(ctx)(opts)),
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
          });

          return b;
        }, toAppError);
      }),
      TE.chain((b) => {
        return TE.tryCatch(
          () =>
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
    directiveType: DirectiveType,
    directives: NonEmptyArray<Directive>,
    opts?: GuardoniCommandOpts
  ): TE.TaskEither<AppError, ExperimentInfo & { publicKey: string | null }> => {
    return pipe(
      dispatchBrowser(ctx)({}),
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
        guardoniExecution(ctx)(
          experiment.experimentId,
          directiveType,
          directives,
          page
        )
      ),
      TE.map((publicKey) => ({
        ...experiment,
        publicKey: publicKey ?? opts?.publicKey,
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
      sequenceS(TE.ApplicativePar)({
        profile: updateGuardoniProfile(ctx)(
          ctx.config.evidenceTag,
          ctx.profile
        ),
        expId: TE.fromEither(validateNonEmptyString(experimentId)),
        localSettings: TE.right(
          setLocalSettings(ctx)({ ...opts, experimentId })
        ),
      }),
      TE.chain(({ profile, expId }) =>
        pipe(
          getDirective(ctx)(expId),
          TE.chain(({ type, data }) => {
            return pipe(
              saveExperiment(ctx)(expId, type, profile),
              TE.chain((exp) => runBrowser(ctx)(exp, type, data, opts))
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
      TE.chain(({ type, data }) =>
        guardoniExecution(ctx)(experimentId, type, data, page)
      ),
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
    directiveType: DirectiveType,
    directives: NonEmptyArray<Directive>,
    page: puppeteer.Page
  ): TE.TaskEither<AppError, string> => {
    const start = new Date();

    ctx.logger.debug(
      `Running experiment %s for directive %s`,
      experiment,
      directiveType
    );

    ctx.logger.debug('Experiment data %O', directives);
    ctx.logger.debug('Config %O', ctx.config);

    return pipe(
      ctx.puppeteer.operateBrowser(page, directives),
      TE.map((pubKey) => {
        const publicKey = pubKey ?? ctx.config.publicKey;
        const duration = differenceInSeconds(new Date(), start);

        ctx.logger.debug(
          `Operations completed in %ds: check results at `,
          duration,
          `${ctx.platform.backend}/${
            directiveType === 'search' ? 'shadowban' : 'experiments'
          }/render/#${experiment}`
        );
        ctx.logger.debug(
          `Personal log at ${ctx.platform.backend}/personal/#${publicKey}`
        );

        return publicKey;
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
  const profile = getDefaultProfile(basePath, cnf.profileName);

  logger.debug('profile %O', profile);

  const platformConf = getPlatformConfig(platform, {
    basePath,
    ...(config as any),
  });

  return pipe(
    checkProfile({ logger })(basePath, cnf),
    TE.chain((p) => readProfile({ logger })(getProfileJsonPath(p))),
    TE.chain((profile) =>
      pipe(
        getChromePath(),
        E.map((chromePath) => ({
          ...config,
          chromePath,
        })),
        E.map((c) => ({
          puppeteer: GetPuppeteer({
            logger,
            puppeteer: p,
            config: {
              loadFor: config.loadFor,
            },
            hooks:
              platform === 'youtube'
                ? GetYTHooks({
                    profile,
                    logger,
                  })
                : GetTKHooks({
                    profile,
                  }),
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
          guardoniConfigFile: path.join(profile.udd, 'guardoni.json'),
          version: getPackageVersion(),
          platform: platformConf,
        })),
        E.mapLeft(toAppError),
        TE.fromEither
      )
    ),
    TE.chainFirst(downloadExtension)
  );
};

export interface Guardoni {
  config: GuardoniConfig;
  platform: PlatformConfig;
  API: APIClient<typeof Endpoints>;
  // register an experiment from the given csv file
  registerExperimentFromCSV: (
    file: NonEmptyString,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  registerExperiment: (
    records: NonEmptyArray<Directive>,
    directiveType: DirectiveType
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
  runBrowser: (opts?: GuardoniCommandOpts) => TE.TaskEither<AppError, void>;
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
    : ['guardoni:info', 'guardoni:error', process.env.DEBUG];

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
            config: ctx.config,
            platform: ctx.platform,
            API: ctx.API,
            runAuto: runAuto(ctx),
            runExperiment: runExperiment(ctx),
            runExperimentForPage: runExperimentForPage(ctx),
            registerExperiment: registerExperiment(ctx),
            registerExperimentFromCSV: registerCSV(ctx),
            listExperiments: listExperiments(ctx),
            runBrowser: runNavigate(ctx),
          };
        })
      );
    },
    run: (conf, platform) => {
      return pipe(
        loadContext(puppeteer, basePath, conf, platform, logger),
        TE.map((ctx) => {
          return {
            config: ctx.config,
            platform: ctx.platform,
            API: ctx.API,
            runAuto: runAuto(ctx),
            runExperiment: runExperiment(ctx),
            runExperimentForPage: runExperimentForPage(ctx),
            registerExperiment: registerExperiment(ctx),
            registerExperimentFromCSV: registerCSV(ctx),
            listExperiments: listExperiments(ctx),
            runBrowser: runNavigate(ctx),
          };
        })
      );
    },
  };
};
