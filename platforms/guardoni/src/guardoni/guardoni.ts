/**
 *
 * Guardoni V2
 *
 * TODO:
 * - filter the directive with "exclude url tag"
 *
 */
import { AppError, toAppError } from '@shared/errors/AppError';
import {
  ComparisonDirectiveRow,
  Directive,
  DirectiveKeysMap,
  DirectiveType,
} from '@shared/models/Directive';
import { APIClient, MakeAPIClient } from '@shared/providers/api.provider';
import { differenceInSeconds } from 'date-fns';
import debug from 'debug';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { PathReporter } from 'io-ts/lib/PathReporter';
import path from 'path';
// import pluginStealth from "puppeteer-extra-plugin-stealth";
import type puppeteer from 'puppeteer-core';
import { dispatchBrowser, operateBrowser } from './browser';
import { getConfig, getPlatformConfig } from './config';
import domainSpecific from './domainSpecific';
import {
  concludeExperiment,
  getDirective,
  listExperiments,
  registerExperiment,
  saveExperiment,
  validateNonEmptyString,
} from './experiment';
import { downloadExtension } from './extension';
import {
  getDefaultProfile,
  checkProfile,
  readProfile,
  updateGuardoniProfile,
  getProfileJsonPath,
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
import { csvParseTE, getPackageVersion, liftFromIOE } from './utils';
import * as Endpoints from '@shared/endpoints'

export const runBrowser =
  (ctx: GuardoniContext) =>
  (
    experiment: ExperimentInfo,
    directiveType: DirectiveType,
    directives: NonEmptyArray<Directive>
  ): TE.TaskEither<AppError, ExperimentInfo & { publicKey: string | null }> => {
    return pipe(
      dispatchBrowser(ctx),
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
      TE.chain((publicKey) =>
        pipe(
          concludeExperiment(ctx)(experiment),
          TE.map((exp) => ({ ...exp, publicKey }))
        )
      )
    );
  };

export const runExperiment =
  (ctx: GuardoniContext) =>
  (experimentId: string): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
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
      }),
      TE.chain(({ profile, expId }) =>
        pipe(
          getDirective(ctx)(expId),
          TE.chain(({ type, data }) => {
            return pipe(
              saveExperiment(ctx)(expId, type, profile),
              TE.chain((exp) => runBrowser(ctx)(exp, type, data))
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
  ): TE.TaskEither<AppError, string | null> => {
    const start = new Date();

    ctx.logger.debug(
      `Running experiment %s for directive %s`,
      experiment,
      directiveType
    );
    ctx.logger.debug('Experiment data %O', directives);

    return pipe(
      TE.tryCatch(
        () => domainSpecific.beforeDirectives(page, ctx.profile),
        (e) => new AppError('BeforeDirectivesError', (e as any).message, [])
      ),
      TE.chain(() => operateBrowser(ctx)(page, directives)),
      TE.chain(() => TE.tryCatch(() => domainSpecific.completed(), toAppError)),
      TE.map((publicKey) => {
        const duration = differenceInSeconds(new Date(), start);

        ctx.logger.debug(
          `Operations completed in %ds: check results at `,
          duration,
          `${ctx.platform.backend}/${
            directiveType === 'chiaroscuro' ? 'shadowban' : 'experiments'
          }/render/#${experiment}`
        );
        ctx.logger.debug(
          `Personal log at ${ctx.platform.backend}/personal/#${publicKey}`
        );

        return publicKey;
      })
    );
  };

export const readCSVAndParse =
  (logger: GuardoniContext['logger']) =>
  (
    filePath: string,
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, NonEmptyArray<ComparisonDirectiveRow>> => {
    logger.debug('Registering CSV from path %s', filePath);

    return pipe(
      liftFromIOE(() => fs.statSync(filePath)),
      TE.mapLeft((e) => {
        return toAppError({
          ...e,
          message: `File at path ${filePath} doesn't exist`,
        });
      }),
      TE.chain(() => liftFromIOE(() => fs.readFileSync(filePath))),
      TE.mapLeft((e) => {
        return toAppError({
          ...e,
          message: `Failed to read csv file ${filePath}`,
        });
      }),
      TE.chain((input) =>
        pipe(
          csvParseTE(input, { columns: true, skip_empty_lines: true }),
          TE.chain(({ records, info }) => {
            logger.debug(
              'Read input from file %s (%d bytes) %d records as %s',
              filePath,
              input.length,
              records.length,
              directiveType
            );

            if (records.length === 0) {
              return TE.left(
                toAppError({
                  message: "Can't create an experiment with no links",
                })
              );
            }

            return TE.right({ records, info });
          }),
          TE.chainFirst(({ records }) =>
            pipe(
              records,
              DirectiveKeysMap.props[directiveType].decode,
              TE.fromEither,
              TE.mapLeft((e) => {
                return new AppError(
                  'CSVParseError',
                  `The given CSV is not compatible with directive "${directiveType}"`,
                  [
                    ...PathReporter.report(E.left(e)),
                    '\n',
                    'You can find examples on https://youtube.tracking.exposed/guardoni',
                  ]
                );
              })
            )
          ),
          TE.map((csvContent) => {
            logger.debug('CSV decoded content %O', csvContent.records);
            return csvContent.records as NonEmptyArray<ComparisonDirectiveRow>;
          })
        )
      )
    );
  };

const registerCSV =
  (ctx: GuardoniContext) =>
  (
    csvFile: string,
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    // resolve csv file path from current working direction when is not absolute
    const filePath = path.isAbsolute(csvFile)
      ? csvFile
      : path.resolve(process.cwd(), csvFile);

    ctx.logger.debug(`Register CSV from %s`, filePath);

    return pipe(
      readCSVAndParse(ctx.logger)(filePath, directiveType),
      TE.chain((records) => registerExperiment(ctx)(records, directiveType))
    );
  };

const loadContext = (
  p: typeof puppeteer,
  basePath: string,
  cnf: GuardoniConfig,
  platform: Platform,
  logger: GuardoniContext['logger']
): TE.TaskEither<AppError, GuardoniContext> => {
  logger.debug('Loading context for platform %s with config %O', platform, cnf);

  const profile = getDefaultProfile(basePath, cnf.profileName);

  logger.debug('profile %O', profile);
  const platformConf = getPlatformConfig(platform, {
    basePath,
    ...(cnf as any),
  });

  return pipe(
    checkProfile({ logger })(basePath, cnf),
    TE.chain((p) => readProfile({ logger })(getProfileJsonPath(p))),
    TE.map((profile) => ({
      puppeteer: p,
      API: MakeAPIClient({
        baseURL: platformConf.backend,
        getAuth: async (req) => req,
        onUnauthorized: async (res) => res,
      }, Endpoints ).API,
      config: {
        ...cnf,
        basePath,
        profileName: profile.profileName,
      },
      profile,
      logger,
      guardoniConfigFile: path.join(profile.udd, 'guardoni.json'),
      version: getPackageVersion(),
      platform: platformConf,
    })),
    TE.chainFirst(downloadExtension)
    // TE.chainFirst((ctx) =>
    //   liftFromIOE(() => fs.mkdirSync(ctx.profile.udd, { recursive: true }))
    // ),
    // TE.chain((ctx) =>
    //   pipe(
    //     liftFromIOE(() =>
    //       fs.statSync(ctx.guardoniConfigFile, { throwIfNoEntry: false })
    //     ),
    //     TE.chain((stat) => {
    //       ctx.logger.debug(
    //         'Path %s exists? %O',
    //         ctx.guardoniConfigFile,
    //         stat !== undefined
    //       );

    //       if (stat) {
    //         return readProfile(ctx)(ctx.guardoniConfigFile);
    //       }

    //       return pipe(
    //         liftFromIOE(() =>
    //           fs.writeFileSync(
    //             ctx.guardoniConfigFile,
    //             JSON.stringify(ctx.profile, null, 2),
    //             'utf-8'
    //           )
    //         ),
    //         TE.map(() => ctx.profile)
    //       );
    //     }),
    //     TE.map((c) => ({
    //       ...ctx,
    //       profile: c,
    //     }))
    //   )
    // )
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
    records: NonEmptyArray<ComparisonDirectiveRow>,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  listExperiments: () => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperiment: (
    experiment: NonEmptyString
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runAuto: (value: '1' | '2') => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperimentForPage: (
    page: puppeteer.Page,
    experiment: NonEmptyString,
    onProgress?: (details: ProgressDetails) => void
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
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

export type GetGuardoni = ({
  basePath,
  logger,
}: {
  basePath: string;
  logger: GuardoniContext['logger'];
  puppeteer: typeof puppeteer;
  verbose?: boolean;
}) => GuardoniLauncher;

export const GetGuardoni: GetGuardoni = ({
  basePath,
  logger,
  puppeteer,
  verbose,
}) => {
  const loggerSpaces = verbose
    ? ['guardoni:info', 'guardoni:debug', 'guardoni:error', process.env.DEBUG]
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
          };
        })
      );
    },
  };
};
