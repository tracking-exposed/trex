/**
 *
 * Guardoni V2
 *
 * TODO:
 * - filter the directive with "exclude url tag"
 *
 */
import { AppError, toAppError } from '@shared/errors/AppError';
import { toValidationError } from '@shared/errors/ValidationError';
import { Logger } from '@shared/logger';
import {
  ChiaroScuroDirective,
  ChiaroScuroDirectiveType,
  ComparisonDirectiveRow,
  ComparisonDirectiveType,
  Directive,
  DirectiveKeysMap,
  DirectiveType,
  PostDirectiveResponse,
  PostDirectiveSuccessResponse,
} from '@shared/models/Directive';
import { APIClient, GetAPI } from '@shared/providers/api.provider';
import { execSync } from 'child_process';
import { differenceInSeconds, format } from 'date-fns';
import debug from 'debug';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as Json from 'fp-ts/lib/Json';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { PathReporter } from 'io-ts/lib/PathReporter';
import _ from 'lodash';
import path from 'path';
// import pluginStealth from "puppeteer-extra-plugin-stealth";
import puppeteer from 'puppeteer-core';
import domainSpecific from './domainSpecific';
import { fsTE } from './fs.provider';
import {
  GuardoniConfig,
  GuardoniConfigRequired,
  GuardoniProfile,
  GuardoniSuccessOutput,
  ProgressDetails,
} from './types';
import { csvParseTE, getChromePath } from './utils';

// const COMMANDJSONEXAMPLE =
//   'https://youtube.tracking.exposed/json/automation-example.json';

const getExtensionWithOptInURL = (v: string): string =>
  'https://github.com/tracking-exposed/yttrex/releases/download/v1.8.992/extension-1.9.0.99.zip';

const DEFAULT_BASE_PATH = process.cwd();
const DEFAULT_BACKEND =
  process.env.BACKEND ?? 'https://youtube.tracking.exposed/api';
const DEFAULT_EXTENSION_DIR = path.resolve(
  DEFAULT_BASE_PATH,
  'build/extension'
);

const DEFAULT_LOAD_FOR = 3000;

interface ExperimentInfo {
  experimentId: string;
  evidenceTag: string;
  directiveType: DirectiveType;
  execCount: number;
  profileName: string;
  newProfile: boolean;
  when: Date;
}

interface GuardoniContext {
  API: APIClient;
  config: GuardoniConfigRequired;
  profile: GuardoniProfile;
  guardoniConfigFile: string;
  logger: Pick<Logger, 'info' | 'error' | 'debug'>;
}

// old functions

const downloadExtension = (
  ctx: GuardoniContext
): IOE.IOEither<AppError, void> => {
  return IOE.tryCatch(() => {
    ctx.logger.debug(`Checking extension manifest.json...`);
    const manifestPath = path.resolve(
      path.join(ctx.config.extensionDir, 'manifest.json')
    );

    const manifest = fs.existsSync(manifestPath);

    if (manifest) {
      ctx.logger.debug(`Manifest found, no need to download the extension`);
      return;
    }

    ctx.logger.debug('Ensure %s dir exists', ctx.config.extensionDir);
    fs.mkdirSync(ctx.config.extensionDir, { recursive: true });

    ctx.logger.debug(
      "Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)"
    );
    const zipFileP = path.resolve(
      path.join(ctx.config.extensionDir, 'tmpzipf.zip')
    );

    execSync(`curl -L ${getExtensionWithOptInURL('')} -o ${zipFileP}`);
    execSync(`unzip ${zipFileP} -d ${ctx.config.extensionDir}`);
  }, toAppError);
};

const dispatchBrowser = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, puppeteer.Browser> => {
  const execCount = ctx.profile.execount;
  const proxy = ctx.config.proxy;

  const commandLineArg = [
    '--no-sandbox',
    '--disabled-setuid-sandbox',
    '--load-extension=' + ctx.config.extensionDir,
    '--disable-extensions-except=' + ctx.config.extensionDir,
  ];

  if (proxy) {
    if (!_.startsWith(proxy, 'socks5://')) {
      return TE.left(
        new AppError(
          'ProxyError',
          'Error, --proxy must start with socks5://',
          []
        )
      );
    }
    commandLineArg.push('--proxy-server=' + proxy);
    ctx.logger.debug(
      'Dispatching browser: profile usage count %d proxy %s',
      execCount,
      proxy
    );
  } else {
    ctx.logger.debug(
      'Dispatching browser: profile usage count %d, with NO PROXY',
      execCount
    );
  }
  return TE.tryCatch(async () => {
    // puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
      headless: ctx.config.headless,
      userDataDir: ctx.profile.udd,
      executablePath: ctx.config.chromePath,
      args: commandLineArg,
    });

    return browser;
  }, toAppError);
};

/**
 * automate directive execution for browser page
 */
const operateTab =
  (ctx: GuardoniContext) =>
  (
    page: puppeteer.Page,
    directive: Directive
  ): TE.TaskEither<AppError, void> => {
    return TE.tryCatch(async () => {
      try {
        await domainSpecific.beforeLoad(page, ctx.profile);
      } catch (error) {
        ctx.logger.debug(
          'error in beforeLoad %s %s directive %o',
          (error as any).message,
          (error as any).stack,
          directive
        );
      }

      const loadFor = (directive as any).loadFor ?? ctx.config.loadFor;

      ctx.logger.info(
        '— Loading %s (for %d ms) %O',
        directive.url,
        loadFor,
        directive
      );
      // Remind you can exclude directive with env/--exclude=urltag

      // TODO the 'timeout' would allow to repeat this operation with
      // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
      await page.goto(directive.url, {
        waitUntil: 'networkidle0',
      });

      try {
        await domainSpecific.beforeWait(page, ctx.profile);
      } catch (error) {
        ctx.logger.error(
          'error in beforeWait %s (%s)',
          (error as any).message,
          (error as any).stack
        );
      }

      ctx.logger.info(
        'Directive to URL %s, Loading delay %d (--load optional)',
        directive.url,
        loadFor
      );
      await page.waitForTimeout(loadFor);

      try {
        await domainSpecific.afterWait(page, directive);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(
          'Error in afterWait',
          (error as any).message,
          (error as any).stack
        );
      }
      ctx.logger.info('— Completed %O \n', directive);
    }, toAppError);
  };

const operateBrowser =
  (ctx: GuardoniContext) =>
  (
    page: puppeteer.Page,
    directives: Directive[]
  ): TE.TaskEither<AppError, void> => {
    return pipe(
      TE.sequenceSeqArray(directives.map((d) => operateTab(ctx)(page, d))),
      TE.chain(() =>
        TE.tryCatch(async () => {
          if (ctx.config.loadFor < 20000) {
            await page.waitForTimeout(15000);
          }
          return undefined;
        }, toAppError)
      )
    );
  };

export const guardoniExecution =
  (ctx: GuardoniContext) =>
  (
    experiment: string,
    directiveType: DirectiveType,
    directives: NonEmptyArray<Directive>,
    page: puppeteer.Page
  ): TE.TaskEither<AppError, void> => {
    const result = { start: new Date(), end: null };

    return pipe(
      TE.tryCatch(
        () => domainSpecific.beforeDirectives(page, ctx.profile),
        toAppError
      ),
      TE.chain(() => operateBrowser(ctx)(page, directives)),
      TE.chain(() => TE.tryCatch(() => domainSpecific.completed(), toAppError)),
      TE.map((publicKey) => {
        ctx.logger.debug(
          `Operations completed: check results at ${ctx.config.backend}/${
            directiveType === 'chiaroscuro' ? 'shadowban' : 'experiments'
          }/render/#${experiment}`
        );
        ctx.logger.debug(
          `Personal log at ${ctx.config.backend}/personal/#${publicKey}`
        );

        return {
          ...result,
          end: new Date(),
        };
      }),
      TE.map(({ start, end }) => {
        const duration = differenceInSeconds(end, start);

        ctx.logger.debug(
          '— Guardoni execution completed in %d seconds.',
          duration
        );
        return undefined;
      })
    );
  };

const concludeExperiment =
  (ctx: GuardoniContext) =>
  (experimentInfo: ExperimentInfo): TE.TaskEither<AppError, ExperimentInfo> => {
    // this conclude the API sent by extension remoteLookup,
    // a connection to DELETE /api/v3/experiment/:publicKey

    return pipe(
      ctx.API.v3.Public.ConcludeExperiment({
        Params: {
          testTime: experimentInfo.when.toISOString(),
        },
      }),
      TE.chain((body) => {
        if (!body.acknowledged) {
          return TE.left(
            new AppError('APIError', "Can't conclude the experiment", [])
          );
        }
        return TE.right(experimentInfo);
      })
    );
  };

const runBrowser =
  (ctx: GuardoniContext) =>
  (
    experiment: ExperimentInfo,
    directiveType: DirectiveType,
    directives: NonEmptyArray<Directive>
  ): TE.TaskEither<AppError, ExperimentInfo> => {
    return pipe(
      dispatchBrowser(ctx),
      TE.chain((browser) => {
        return TE.tryCatch(async () => {
          const [page, ...otherPages] = await browser.pages();

          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          _.tail(otherPages).forEach(async (p): Promise<void> => {
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
      TE.chain(() => concludeExperiment(ctx)(experiment))
    );
  };

const getDirective =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString
  ): TE.TaskEither<
    AppError,
    { type: DirectiveType; data: NonEmptyArray<Directive> }
  > => {
    return pipe(
      ctx.API.v3.Public.GetDirective({
        Params: {
          experimentId,
        },
      }),
      TE.map((data) => {
        ctx.logger.debug(`Data for experiment (%s) %O`, experimentId, data);
        const directiveType = ChiaroScuroDirective.is(data[0])
          ? ChiaroScuroDirectiveType.value
          : ComparisonDirectiveType.value;

        return { type: directiveType, data };
      })
    );
  };

const createExperimentInAPI =
  ({ API, logger }: GuardoniContext) =>
  (
    directiveType: DirectiveType,
    parsedCSV: ComparisonDirectiveRow[]
  ): TE.TaskEither<AppError, PostDirectiveSuccessResponse> => {
    return pipe(
      API.v3.Public.PostDirective({
        Params: { directiveType },
        Body: { parsedCSV },
        Headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }),
      TE.chain((response) => {
        logger.debug('Create experiment response %O', response);

        if (PostDirectiveResponse.types[0].is(response)) {
          return TE.left(
            new AppError('PostDirectiveError', response.error.message, [])
          );
        }

        return TE.right(response);
      })
    );
  };

export const readCSVAndParse =
  (logger: GuardoniContext['logger']) =>
  (
    filePath: string,
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, ComparisonDirectiveRow[]> => {
    logger.debug('Registering CSV from path %s', filePath);

    return pipe(
      fsTE.statOrFail(filePath, {}),
      TE.mapLeft((e) =>
        toAppError({
          ...e,
          message: `File at path ${filePath} doesn't exist`,
        })
      ),
      TE.chain(() => fsTE.readFile(filePath, 'utf-8')),
      TE.mapLeft((e) => {
        return toAppError({
          ...e,
          message: `Failed to read csv file ${filePath}`,
        });
      }),
      TE.chain((input) =>
        pipe(
          csvParseTE(input, { columns: true, skip_empty_lines: true }),
          TE.map(({ records, info }) => {
            logger.debug(
              'Read input from file %s (%d bytes) %d records as %s',
              filePath,
              input.length,
              records.length,
              directiveType
            );
            return { records, info };
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
            logger.debug('CSV decoded content %J', csvContent);
            return csvContent.records;
          })
        )
      )
    );
  };

const registerExperiment =
  (ctx: GuardoniContext) =>
  (
    records: ComparisonDirectiveRow[],
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    return pipe(
      createExperimentInAPI(ctx)(directiveType, records),
      TE.map((experiment) => {
        ctx.logger.debug('Experiment received %O', experiment);
        // handle output for existing experiment
        if (
          PostDirectiveSuccessResponse.is(experiment) &&
          experiment.status === 'exist'
        ) {
          return {
            type: 'success',
            message: `Experiment already available`,
            values: experiment,
          };
        }

        return {
          type: 'success',
          message: `Experiment created successfully`,
          values: experiment,
        };
      })
    );
  };

const registerCSV =
  (ctx: GuardoniContext) =>
  (
    csvFile: string,
    directiveType: DirectiveType
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    const filePath = path.resolve(ctx.config.basePath, csvFile);

    return pipe(
      readCSVAndParse(ctx.logger)(filePath, directiveType),
      TE.chain((records) => registerExperiment(ctx)(records, directiveType))
    );
  };

const saveExperiment =
  (ctx: GuardoniContext) =>
  (
    experimentId: NonEmptyString,
    directiveType: DirectiveType,
    profile: GuardoniProfile
  ): TE.TaskEither<AppError, ExperimentInfo> => {
    ctx.logger.debug(
      'Saving experiment info in extension/experiment.json (would be read by the extension)'
    );
    const experimentJSONFile = path.join(
      ctx.config.extensionDir,
      'experiment.json'
    );

    const experimentInfo = {
      experimentId,
      evidenceTag: ctx.config.evidenceTag,
      directiveType,
      execCount: profile.execount,
      profileName: profile.profileName,
      newProfile: profile.newProfile,
      when: new Date(),
    };

    // profinfo.expinfo = experimentInfo;

    return pipe(
      fsTE.lift(fsTE.maybeStat(experimentJSONFile)),
      TE.chain((stat) => {
        if (stat) {
          return TE.right(undefined);
        }
        return fsTE.writeFile(
          experimentJSONFile,
          JSON.stringify(experimentInfo),
          'utf-8'
        );
      }),
      fsTE.lift,
      TE.map(() => experimentInfo)
    );
  };

const ensureProfileExistsAtPath = (
  basePath: string,
  profileName: string
): TE.TaskEither<AppError, string> => {
  const profileDir = getProfileDataDir(basePath, profileName);
  return pipe(
    fsTE.maybeStat(profileDir),
    TE.mapLeft(toAppError),
    TE.chain((stat) => {
      if (!stat) {
        return pipe(
          fsTE.mkdir(profileDir, { recursive: true }),
          TE.mapLeft(toAppError),
          TE.map(() => stat)
        );
      }
      return TE.right(stat);
    }),
    TE.map(() => profileName)
  );
};

// todo: check if a profile already exists in the file system
const checkProfile =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (conf: GuardoniConfig): TE.TaskEither<AppError, string> => {
    const basePath = conf.basePath ?? DEFAULT_BASE_PATH;
    const profilesDir = path.resolve(basePath, 'profiles');

    // no profile given, try to retrieve the old one
    if (!conf.profileName) {
      ctx.logger.debug(
        'Profile not defined, looking for older profiles in %s',
        profilesDir
      );
      // check 'profiles' dir in basePath exists
      const exists = fs.statSync(profilesDir, { throwIfNoEntry: false });
      // create 'profiles' dir if doesn't exist
      if (!exists) {
        ctx.logger.debug('Profile dir not found, creating it...', profilesDir);
        fs.mkdirSync(profilesDir, { recursive: true });
      }

      const profiles = fs.readdirSync(profilesDir);

      if (profiles.length === 0) {
        const profileName =
          conf.evidenceTag ?? `guardoni-${format(new Date(), 'YYYY-MM-DD')}`;
        ctx.logger.debug('Creating profile %O in %s', profileName, basePath);
        return ensureProfileExistsAtPath(basePath, profileName);
      }

      const lastProfile = profiles[profiles.length - 1];
      ctx.logger.debug('Last profile found %s', lastProfile);
      return TE.right(lastProfile);
    }

    return TE.right(conf.profileName);
  };

export const getConfigWithDefaults =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (conf: GuardoniConfig): TE.TaskEither<AppError, GuardoniConfigRequired> => {
    const evidenceTag = conf.evidenceTag ?? 'no-tag-' + _.random(0, 0xffff);
    ctx.logger.debug('EvidenceTag %O', evidenceTag);

    const sanitizedConf = Object.entries(conf).reduce<GuardoniConfig>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          return {
            ...acc,
            [key]: value,
          };
        }
        return acc;
      },
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
      {} as any
    );

    return pipe(
      sequenceS(TE.ApplicativePar)({
        profileName: checkProfile(ctx)(conf),
        chromePath: pipe(
          TE.fromEither(getChromePath()),
          TE.mapLeft(toAppError)
        ),
      }),
      TE.map(({ profileName, chromePath }) => ({
        chromePath,
        evidenceTag,
        extensionDir: DEFAULT_EXTENSION_DIR,
        backend: DEFAULT_BACKEND,
        loadFor: DEFAULT_LOAD_FOR,
        profileName,
        basePath: sanitizedConf.basePath
          ? path.resolve(process.cwd(), sanitizedConf.basePath)
          : DEFAULT_BASE_PATH,
        ...sanitizedConf,
      }))
    );
  };

const readProfile = (
  profilePath: string
): TE.TaskEither<AppError, GuardoniProfile> => {
  return pipe(
    fsTE.lift(fsTE.readFile(profilePath, 'utf-8')),
    TE.chain((data) =>
      pipe(
        Json.parse(data),
        E.mapLeft(
          () =>
            new AppError(
              'ReadProfileError',
              "Can't decode the content of the profile",
              []
            )
        ),
        E.chain((d) => pipe(GuardoniProfile.decode(d), E.mapLeft(toAppError))),
        TE.fromEither
      )
    )
  );
};

const updateGuardoniProfile =
  (ctx: GuardoniContext) =>
  (evidenceTag: string): TE.TaskEither<AppError, GuardoniProfile> => {
    ctx.logger.debug('Updating guardoni config %s', ctx.guardoniConfigFile);

    return pipe(
      fsTE.lift(fsTE.readFile(ctx.guardoniConfigFile, 'utf-8')),
      TE.chainEitherK((content) => Json.parse(content)),
      TE.mapLeft(toAppError),
      TE.map((content) => {
        ctx.logger.debug('File content %O', content);
        return content;
      }),
      TE.chainEitherK((content) =>
        pipe(GuardoniProfile.decode(content), E.mapLeft(toAppError))
      ),
      TE.chain((guardoniProfile) => {
        const execCount = guardoniProfile.execount + 1;
        const updatedProfile: GuardoniProfile = {
          ...guardoniProfile,
          newProfile: execCount === 0,
          execount: guardoniProfile.execount + 1,
          evidencetag: guardoniProfile.evidencetag.concat(evidenceTag),
        };

        ctx.logger.debug('Writing guardoni config %O', updatedProfile);
        return pipe(
          fsTE.lift(
            fsTE.writeFile(
              ctx.guardoniConfigFile,
              JSON.stringify(updatedProfile, undefined, 2),
              'utf-8'
            )
          ),
          TE.map(() => {
            ctx.logger.debug(
              'profile %s wrote %j',
              ctx.guardoniConfigFile,
              updatedProfile
            );
            return updatedProfile;
          })
        );
      })
    );
  };

const validateNonEmptyString = (
  s: string
): E.Either<AppError, NonEmptyString> =>
  pipe(
    NonEmptyString.decode(s),
    E.mapLeft((e) =>
      toValidationError(
        'Run experiment validation',
        PathReporter.report(E.left(e))
      )
    )
  );

const runExperiment =
  (ctx: GuardoniContext) =>
  (experimentId: string): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    ctx.logger.info('Running experiment %s', experimentId);
    return pipe(
      sequenceS(TE.ApplicativePar)({
        profile: updateGuardoniProfile(ctx)(ctx.config.evidenceTag),
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
        values: result,
      }))
    );
  };

const runExperimentForPage =
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
      TE.map((result) => ({
        type: 'success',
        message: 'Experiment completed',
        values: {},
      }))
    );

const runAuto =
  (ctx: GuardoniContext) =>
  (value: '1' | '2'): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    const experimentId: NonEmptyString =
      value === '2'
        ? ('d75f9eaf465d2cd555de65eaf61a770c82d59451' as any)
        : ('37384a9b7dff26184cdea226ad5666ca8cbbf456' as any);

    ctx.logger.debug('Run in auto mode with experiment %s', experimentId);

    return runExperiment(ctx)(experimentId);
  };

export const getProfileDataDir = (
  basePath: string,
  profileName: string
): string => path.join(basePath, 'profiles', profileName);

export const getDefaultProfile = (
  basePath: string,
  profileName: string,
  extensionDir: string
): GuardoniProfile => {
  return {
    udd: getProfileDataDir(basePath, profileName),
    newProfile: true,
    profileName,
    extensionDir,
    evidencetag: [],
    execount: 0,
  };
};

const loadContext = (
  partialConfig: GuardoniConfig,
  logger: GuardoniContext['logger']
): TE.TaskEither<AppError, GuardoniContext> => {
  logger.debug('Starting guardoni with config %O', partialConfig);

  return pipe(
    getConfigWithDefaults({ logger })(partialConfig),
    TE.map((config): GuardoniContext => {
      const profile = getDefaultProfile(
        config.basePath,
        config.profileName,
        config.extensionDir
      );

      return {
        API: GetAPI({ baseURL: config.backend }).API,
        config: {
          ...config,
          profileName: profile.profileName,
        },
        profile,
        logger,
        guardoniConfigFile: path.join(profile.udd, 'guardoni.json'),
      };
    }),
    TE.map(({ logger, ...context }) => {
      logger.debug('Context %O', context);
      return { logger, ...context };
    }),
    TE.chainFirst((ctx) => TE.fromIOEither(downloadExtension(ctx))),
    TE.chainFirst((ctx) =>
      fsTE.lift(fsTE.mkdir(ctx.profile.udd, { recursive: true }))
    ),
    TE.chain((ctx) =>
      pipe(
        fsTE.lift(fsTE.maybeStat(ctx.guardoniConfigFile)),
        TE.chain((stat) => {
          ctx.logger.debug(
            'Path %s exists? %O',
            ctx.guardoniConfigFile,
            stat !== undefined
          );
          if (stat) {
            return readProfile(ctx.guardoniConfigFile);
          }
          return pipe(
            fsTE.lift(
              fsTE.writeFile(
                ctx.guardoniConfigFile,
                JSON.stringify(ctx.profile, null, 2),
                'utf-8'
              )
            ),
            TE.map(() => ctx.profile)
          );
        }),
        TE.map((c) => ({
          ...ctx,
          profile: c,
        }))
      )
    )
  );
};

export interface Guardoni {
  config: GuardoniConfigRequired;
  // register an experiment from the given csv file
  registerExperimentFromCSV: (
    file: NonEmptyString,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  registerExperiment: (
    records: ComparisonDirectiveRow[],
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
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

export type GetGuardoni = ({
  config,
  logger,
}: {
  config: GuardoniConfig;
  logger: GuardoniContext['logger'];
}) => TE.TaskEither<AppError, Guardoni>;

export const GetGuardoni: GetGuardoni = ({
  config,
  logger,
}): TE.TaskEither<AppError, Guardoni> => {
  const loggerSpaces = config.verbose
    ? ['guardoni::info', 'guardoni::debug', 'guardoni::error']
    : ['guardoni::info', 'guardoni::error'];

  debug.enable(loggerSpaces.join(','));

  return pipe(
    loadContext(config, logger),
    TE.map((ctx) => {
      return {
        config: ctx.config,
        runAuto: runAuto(ctx),
        runExperiment: runExperiment(ctx),
        runExperimentForPage: runExperimentForPage(ctx),
        registerExperiment: registerExperiment(ctx),
        registerExperimentFromCSV: registerCSV(ctx),
      };
    })
  );
};
