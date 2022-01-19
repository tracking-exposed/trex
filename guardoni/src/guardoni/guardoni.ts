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
import debug from 'debug';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as Json from 'fp-ts/lib/Json';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { PathReporter } from 'io-ts/lib/PathReporter';
import _ from 'lodash';
import moment from 'moment';
import path from 'path';
// import pluginStealth from "puppeteer-extra-plugin-stealth";
import puppeteer from 'puppeteer-core';
import * as domainSpecific from '../domainSpecific';
import { guardoniLogger } from '../logger';
import { fsTE } from './fs.provider';
import {
  Guardoni,
  GuardoniConfig,
  GuardoniConfigRequired,
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

const GuardoniProfile = t.strict(
  {
    udd: t.string,
    profileName: t.string,
    newProfile: t.boolean,
    extensionDir: t.string,
    execCount: t.number,
    evidenceTags: t.array(t.string),
  },
  'Profile'
);

type GuardoniProfile = t.TypeOf<typeof GuardoniProfile>;

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
}

// old functions

const downloadExtension = (
  ctx: GuardoniContext
): IOE.IOEither<AppError, void> => {
  return IOE.tryCatch(() => {
    guardoniLogger.debug(`Checking extension manifest.json...`);
    const manifestPath = path.resolve(
      path.join(ctx.config.extensionDir, 'manifest.json')
    );

    const manifest = fs.existsSync(manifestPath);

    if (manifest) {
      guardoniLogger.debug(`Manifest found, no need to download the extension`);
      return;
    }

    guardoniLogger.debug('Ensure %s dir exists', ctx.config.extensionDir);
    fs.mkdirSync(ctx.config.extensionDir, { recursive: true });

    guardoniLogger.debug(
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
  const execCount = ctx.profile.execCount;
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
    guardoniLogger.debug(
      'Dispatching browser: profile usage count %d proxy %s',
      execCount,
      proxy
    );
  } else {
    guardoniLogger.debug(
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
        await domainSpecific.beforeLoad(page, directive);
      } catch (error) {
        guardoniLogger.debug(
          'error in beforeLoad %s %s directive %o',
          (error as any).message,
          (error as any).stack,
          directive
        );
      }

      const loadFor = (directive as any).loadFor ?? ctx.config.loadFor;

      guardoniLogger.info(
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
        await domainSpecific.beforeWait(page, directive);
      } catch (error) {
        guardoniLogger.error(
          'error in beforeWait %s (%s)',
          (error as any).message,
          (error as any).stack
        );
      }

      guardoniLogger.info(
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
      guardoniLogger.info('— Completed %O \n', directive);
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
  ): TE.TaskEither<AppError, { start: moment.Moment; end: moment.Moment }> => {
    const result = { start: moment(), end: null };

    return pipe(
      TE.tryCatch(
        () => domainSpecific.beforeDirectives(page, ctx.profile),
        toAppError
      ),
      TE.chain(() => operateBrowser(ctx)(page, directives)),
      TE.chain(() => TE.tryCatch(() => domainSpecific.completed(), toAppError)),
      TE.map((publicKey) => {
        guardoniLogger.debug(
          `Operations completed: check results at ${ctx.config.backend}/${
            directiveType === 'chiaroscuro' ? 'shadowban' : 'experiments'
          }/render/#${experiment}`
        );
        guardoniLogger.debug(
          `Personal log at ${ctx.config.backend}/personal/#${publicKey}`
        );

        return {
          ...result,
          end: moment(),
        };
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
          testTime: moment(experimentInfo.when).toISOString(),
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
            guardoniLogger.debug("Closing a tab that shouldn't be there!");
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
      TE.map(({ start, end }) => {
        guardoniLogger.debug(
          '— Guardoni execution completed in %d',
          moment.duration((end as any) - (start as any)).humanize()
        );
        return undefined;
      }),
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
        guardoniLogger.debug(`Data for experiment (%s) %O`, experimentId, data);
        const directiveType = ChiaroScuroDirective.is(data[0])
          ? ChiaroScuroDirectiveType.value
          : ComparisonDirectiveType.value;

        return { type: directiveType, data };
      })
    );
  };

const createExperimentInAPI =
  ({ API }: GuardoniContext) =>
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
        guardoniLogger.debug('Create experiment response %O', response);

        if (PostDirectiveResponse.types[0].is(response)) {
          return TE.left(
            new AppError('PostDirectiveError', response.error.message, [])
          );
        }

        return TE.right(response);
      })
    );
  };

export const readCSVAndParse = (
  filePath: string,
  directiveType: DirectiveType
): TE.TaskEither<AppError, ComparisonDirectiveRow[]> => {
  guardoniLogger.debug('Registering CSV from path %s', filePath);

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
          guardoniLogger.debug(
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
          guardoniLogger.debug('CSV decoded content %J', csvContent);
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
        guardoniLogger.debug('Experiment received %O', experiment);
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
      readCSVAndParse(filePath, directiveType),
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
    guardoniLogger.debug(
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
      execCount: profile.execCount,
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

const ensureProfileExists = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, GuardoniContext> => {
  return pipe(
    fsTE.maybeStat(ctx.profile.udd),
    TE.mapLeft(toAppError),
    TE.chain((stat) => {
      if (!stat) {
        return pipe(
          fsTE.mkdir(ctx.profile.udd, { recursive: true }),
          TE.mapLeft(toAppError),
          TE.map(() => stat)
        );
      }
      return TE.right(stat);
    }),
    TE.map(() => ctx)
  );
};

const sanityChecks = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, GuardoniContext> => {
  return pipe(ensureProfileExists(ctx));
};

// todo: check if a profile already exists in the file system
const getProfile = (config: GuardoniConfig): string => {
  return (
    config.profile ??
    config.evidenceTag ??
    `guardoni-${moment().format('YYYY-MM-DD')}`
  );
};

export const getConfigWithDefaults = (
  conf: GuardoniConfig
): GuardoniConfigRequired => {
  const evidenceTag = 'no-tag-' + _.random(0, 0xffff);
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

  return {
    chromePath: pipe(
      getChromePath(),
      E.getOrElse(() => 'path-invalid')
    ),
    evidenceTag,
    extensionDir: DEFAULT_EXTENSION_DIR,
    backend: DEFAULT_BACKEND,
    loadFor: DEFAULT_LOAD_FOR,
    profile: getProfile({ ...conf, evidenceTag }),
    basePath: sanitizedConf.basePath
      ? path.resolve(process.cwd(), sanitizedConf.basePath)
      : DEFAULT_BASE_PATH,
    ...sanitizedConf,
  };
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
    guardoniLogger.debug('Updating guardoni config %s', ctx.guardoniConfigFile);

    return pipe(
      fsTE.lift(fsTE.readFile(ctx.guardoniConfigFile, 'utf-8')),
      TE.chainEitherK((content) => Json.parse(content)),
      TE.mapLeft(toAppError),
      TE.map((content) => {
        guardoniLogger.debug('File content %O', content);
        return content;
      }),
      TE.chainEitherK((content) =>
        pipe(GuardoniProfile.decode(content), E.mapLeft(toAppError))
      ),
      TE.chain((guardoniProfile) => {
        const execCount = guardoniProfile.execCount + 1;
        const updatedProfile: GuardoniProfile = {
          ...guardoniProfile,
          newProfile: execCount === 0,
          execCount: guardoniProfile.execCount + 1,
          evidenceTags: guardoniProfile.evidenceTags.concat(evidenceTag),
        };

        guardoniLogger.debug('Writing guardoni config %O', updatedProfile);
        return pipe(
          fsTE.lift(
            fsTE.writeFile(
              ctx.guardoniConfigFile,
              JSON.stringify(updatedProfile, undefined, 2),
              'utf-8'
            )
          ),
          TE.map(() => {
            guardoniLogger.debug(
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
    guardoniLogger.info('Running experiment %s', experimentId);
    return pipe(
      sanityChecks(ctx),
      TE.chain((ctx) =>
        sequenceS(TE.ApplicativePar)({
          profile: updateGuardoniProfile(ctx)(ctx.config.evidenceTag),
          expId: TE.fromEither(validateNonEmptyString(experimentId)),
        })
      ),
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
        values: result,
      }))
    );

const runAuto =
  (ctx: GuardoniContext) =>
  (value: '1' | '2'): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    const experimentId: NonEmptyString =
      value === '2'
        ? ('d75f9eaf465d2cd555de65eaf61a770c82d59451' as any)
        : ('37384a9b7dff26184cdea226ad5666ca8cbbf456' as any);

    guardoniLogger.debug('Run in auto mode with experiment %s', experimentId);

    return runExperiment(ctx)(experimentId);
  };

const loadContext = (
  config: GuardoniConfigRequired
): TE.TaskEither<AppError, GuardoniContext> => {
  guardoniLogger.debug('Loading context with config %O', config);

  // backend client instance
  const { API } = GetAPI({ baseURL: config.backend });

  // user data dir
  const userDataDir = path.resolve(config.basePath, 'profiles', config.profile);

  guardoniLogger.debug('User data dir %s', userDataDir);

  // guardoni config
  const guardoniConfigFile = path.join(userDataDir, 'guardoni.json');

  guardoniLogger.debug('Guardoni profile config file %s', guardoniConfigFile);

  // extension dir
  const extensionDir = config.extensionDir ?? config.basePath;

  guardoniLogger.debug('Extension dir %s', extensionDir);

  const defaultProfile = {
    udd: userDataDir,
    newProfile: true,
    profileName: config.profile,
    extensionDir,
    evidenceTags: [],
    execCount: 0,
  };

  return pipe(
    getChromePath(),
    E.mapLeft(toAppError),
    TE.fromEither,
    TE.map(
      (chromePath): GuardoniContext => ({
        API,
        config: { ...config, extensionDir, chromePath },
        profile: defaultProfile,
        guardoniConfigFile,
      })
    ),
    TE.map((context) => {
      guardoniLogger.debug('Default context %O', context);
      return context;
    }),
    TE.chainFirst((ctx) => TE.fromIOEither(downloadExtension(ctx))),
    TE.chainFirst((ctx) =>
      fsTE.lift(fsTE.mkdir(ctx.profile.udd, { recursive: true }))
    ),
    TE.chain((ctx) =>
      pipe(
        fsTE.lift(fsTE.maybeStat(ctx.guardoniConfigFile)),
        TE.chain((stat) => {
          guardoniLogger.debug('Stat for %s: %O', ctx.guardoniConfigFile, stat);
          if (stat) {
            return readProfile(ctx.guardoniConfigFile);
          }
          return pipe(
            fsTE.lift(
              fsTE.writeFile(
                ctx.guardoniConfigFile,
                JSON.stringify(defaultProfile, null, 2),
                'utf-8'
              )
            ),
            TE.map(() => defaultProfile)
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

export type GetGuardoni = (config: GuardoniConfig) => Guardoni;

export const GetGuardoni: GetGuardoni = (config) => {
  debug.enable('guardoni::info,guardoni::error');
  if (config.verbose) {
    debug.enable('guardoni*');
  }

  guardoniLogger.debug('Get guardoni with config %O', config);

  const configWithDefaults = getConfigWithDefaults(config);

  return {
    config: configWithDefaults,
    runAuto: (value) =>
      pipe(
        loadContext(configWithDefaults),
        TE.chain((ctx) => runAuto(ctx)(value))
      ),
    runExperiment: (experimentId) =>
      pipe(
        loadContext(configWithDefaults),
        TE.chain((ctx) => runExperiment(ctx)(experimentId))
      ),
    runExperimentForPage: (page, experimentId, onProgress) =>
      pipe(
        loadContext(configWithDefaults),
        TE.chain((ctx) =>
          runExperimentForPage(ctx)(page, experimentId, onProgress)
        )
      ),
    registerExperiment: (experiment, directiveType) =>
      pipe(
        loadContext(configWithDefaults),
        TE.chain((ctx) => registerExperiment(ctx)(experiment, directiveType))
      ),
    registerExperimentFromCSV: (file, directiveType) =>
      pipe(
        loadContext(configWithDefaults),
        TE.chain((ctx) => registerCSV(ctx)(file, directiveType))
      ),
  };
};
