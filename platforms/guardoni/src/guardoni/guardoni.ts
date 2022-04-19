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
import axios from 'axios';
import { differenceInSeconds, format } from 'date-fns';
import debug from 'debug';
import extractZip from 'extract-zip';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as Json from 'fp-ts/lib/Json';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { failure, PathReporter } from 'io-ts/lib/PathReporter';
import _ from 'lodash';
import path from 'path';
// import pluginStealth from "puppeteer-extra-plugin-stealth";
import type puppeteer from 'puppeteer-core';
import { Platform } from '../electron/app/Header';
// import { getPackageVersion } from '../utils';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_LOAD_FOR,
  DEFAULT_TK_BACKEND,
  DEFAULT_TK_EXTENSION_DIR,
  DEFAULT_YT_BACKEND,
  DEFAULT_YT_EXTENSION_DIR,
} from './constants';
import domainSpecific from './domainSpecific';
import {
  GuardoniConfig,
  GuardoniConfigRequired,
  GuardoniProfile,
  GuardoniSuccessOutput,
  ProgressDetails,
} from './types';
import {
  csvParseTE,
  getChromePath,
  getPackageVersion,
  liftFromIOE,
} from './utils';

// const COMMANDJSONEXAMPLE =
//   'https://youtube.tracking.exposed/json/automation-example.json';

const getExtensionWithOptInURL = (platform: Platform, v: string): string => {
  const platformChunk = platform === 'youtube' ? 'yttrex' : 'tktrex';
  return `https://github.com/tracking-exposed/yttrex/releases/download/v${v}/guardoni-${platformChunk}-extension-${v}.zip`;
};

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
  puppeteer: typeof puppeteer;
  API: APIClient;
  config: GuardoniConfigRequired;
  profile: GuardoniProfile;
  guardoniConfigFile: string;
  logger: Pick<Logger, 'info' | 'error' | 'debug'>;
  version: string;
}

const getConfigPlatformKey = (
  p: Platform
): keyof Pick<GuardoniConfig, 'yt' | 'tk'> => {
  if (p === 'tiktok') {
    return 'tk';
  }
  return 'yt';
};

// old functions

const downloadExtension = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, void> => {
  const extensionDir = ctx.config.platform.extensionDir;

  return pipe(
    IOE.tryCatch(() => {
      ctx.logger.debug(`Checking extension manifest.json at %s`, extensionDir);

      const manifestPath = path.resolve(
        path.join(extensionDir, 'manifest.json')
      );

      const manifest = fs.existsSync(manifestPath);

      if (manifest) {
        ctx.logger.debug(`Manifest found, no need to download the extension`);
        return undefined;
      }

      ctx.logger.debug('Ensure %s dir exists', extensionDir);
      fs.mkdirSync(extensionDir, { recursive: true });

      ctx.logger.debug(
        "Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)"
      );
      const extensionZipFilePath = path.resolve(
        path.join(
          extensionDir,
          `${ctx.config.platform.name}-trex-extension-v${ctx.version}.zip`
        )
      );

      const extensionZipUrl = getExtensionWithOptInURL(
        ctx.config.platform.name,
        ctx.version
      );

      return { extensionZipUrl, extensionZipFilePath };
    }, toAppError),
    TE.fromIOEither,
    TE.chain((downloadDetails) => {
      if (!downloadDetails) {
        return TE.right(undefined);
      }

      const extensionExists = fs.existsSync(
        downloadDetails.extensionZipFilePath
      );

      ctx.logger.debug(
        'Extension exists at path %s? %d',
        downloadDetails.extensionZipFilePath,
        extensionExists
      );

      const downloadAndSaveTE = pipe(
        TE.tryCatch(() => {
          ctx.logger.debug(
            'Download extension from remote %s',
            downloadDetails.extensionZipUrl
          );
          return axios
            .request({
              url: downloadDetails.extensionZipUrl,
              responseType: 'arraybuffer',
            })
            .then((r) => r.data);
        }, toAppError),
        TE.chainIOEitherK((buf) =>
          IOE.tryCatch(() => {
            ctx.logger.debug(
              'Saving extension to %s',
              downloadDetails.extensionZipFilePath
            );
            fs.writeFileSync(
              downloadDetails.extensionZipFilePath,
              buf,
              'utf-8'
            );
          }, toAppError)
        )
      );

      return pipe(
        extensionExists ? TE.right(undefined) : downloadAndSaveTE,
        TE.chain(() =>
          TE.tryCatch(() => {
            ctx.logger.debug(
              'Extracting extension from %s and save it to %s',
              downloadDetails.extensionZipFilePath,
              extensionDir
            );
            return extractZip(downloadDetails.extensionZipFilePath, {
              dir: extensionDir,
            });
          }, toAppError)
        )
      );
    })
  );
};

const dispatchBrowser = (
  ctx: GuardoniContext
): TE.TaskEither<AppError, puppeteer.Browser> => {
  const execCount = ctx.profile.execount;
  const proxy = ctx.config.platform.proxy;

  const commandLineArg = [
    '--no-sandbox',
    '--disabled-setuid-sandbox',
    '--load-extension=' + ctx.config.platform.extensionDir,
    '--disable-extensions-except=' + ctx.config.platform.extensionDir,
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
    const browser = await ctx.puppeteer.launch({
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
          `${ctx.config.platform.backend}/${
            directiveType === 'chiaroscuro' ? 'shadowban' : 'experiments'
          }/render/#${experiment}`
        );
        ctx.logger.debug(
          `Personal log at ${ctx.config.platform.backend}/personal/#${publicKey}`
        );

        return publicKey;
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
  ): TE.TaskEither<AppError, ExperimentInfo & { publicKey: string | null }> => {
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
      TE.chain((publicKey) =>
        pipe(
          concludeExperiment(ctx)(experiment),
          TE.map((exp) => ({ ...exp, publicKey }))
        )
      )
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
            logger.debug('CSV decoded content %O', csvContent.records);
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
    ctx.logger.debug('Creating experiment %O', { records, directiveType });
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
            values: [experiment],
          };
        }

        return {
          type: 'success',
          message: `Experiment created successfully`,
          values: [experiment],
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
    const filePath = path.resolve(process.cwd(), csvFile);

    ctx.logger.debug(`Register CSV from %s`, filePath);

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
      ctx.config.platform.extensionDir,
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
      liftFromIOE(() =>
        fs.statSync(experimentJSONFile, { throwIfNoEntry: false })
      ),
      TE.chain((stat) => {
        if (stat) {
          return TE.right(undefined);
        }
        return liftFromIOE(() =>
          fs.writeFileSync(
            experimentJSONFile,
            JSON.stringify(experimentInfo),
            'utf-8'
          )
        );
      }),
      TE.map(() => experimentInfo)
    );
  };

const listExperiments =
  (ctx: GuardoniContext) =>
  (): TE.TaskEither<AppError, GuardoniSuccessOutput> => {
    return pipe(
      ctx.API.v3.Public.GetPublicDirectives(),
      TE.map(
        (experiments): GuardoniSuccessOutput => ({
          message: 'Experiments List',
          type: 'success',
          values:
            experiments.length > 0
              ? experiments.map((e) => ({
                  [e.experimentId]: e,
                }))
              : [
                  {
                    experiments: [],
                  },
                ],
        })
      )
    );
  };

// const ensureProfileExistsAtPath = (
//   basePath: string,
//   profileName: string
// ): TE.TaskEither<AppError, string> => {
//   const profileDir = getProfileDataDir(basePath, profileName);

//   const stats = fs.existsSync(profileDir);

//   if (!stats) {
//     fs.mkdirSync(profileDir, { recursive: true });
//   }
//   return TE.right(profileName);
// };

// todo: check if a profile already exists in the file system
const checkProfile =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (conf: GuardoniConfig): TE.TaskEither<AppError, string> => {
    const basePath = conf.basePath ?? DEFAULT_BASE_PATH;
    const profilesDir = path.resolve(basePath, 'profiles');

    ctx.logger.debug('Check profile at %s', profilesDir);

    const exists = fs.existsSync(profilesDir);

    ctx.logger.debug('Profile dir exists? %s (%s)', profilesDir, exists);

    if (!exists) {
      ctx.logger.debug('Creating dir %s', profilesDir);
      fs.mkdirSync(profilesDir, { recursive: true });
    }

    const profiles = fs.readdirSync(profilesDir);

    // no profile given, try to retrieve the old one

    ctx.logger.debug('Profiles %O', profiles);

    const lastProfile =
      profiles !== undefined ? profiles[profiles.length - 1] : undefined;

    const profileName =
      conf.profileName ??
      lastProfile ??
      conf.evidenceTag ??
      `guardoni-${format(new Date(), 'yyyy-MM-dd')}`;

    const profileDir = getProfileDataDir(basePath, profileName);

    const profileDirExists = fs.existsSync(profileDir);
    ctx.logger.debug('Profile dir %s exists?', profileDir, profileDirExists);

    if (!profileDirExists) {
      ctx.logger.debug('Creating profile %O in %s', profileDir);
      fs.mkdirSync(profileDir, { recursive: true });
    }

    ctx.logger.debug('Returning profile %s', profileName);

    return TE.right(profileName);
  };

export const getConfigPath = (basePath: string): string =>
  path.resolve(basePath, 'guardoni.config.json');

export const getConfig = (
  basePath: string,
  p: Platform,
  defaultConf: GuardoniConfig
): TE.TaskEither<AppError, GuardoniConfig> => {
  const configFilePath = getConfigPath(basePath);

  if (fs.existsSync(configFilePath)) {
    return pipe(
      IOE.tryCatch(() => {
        return fs.readFileSync(configFilePath, 'utf-8');
      }, toAppError),
      TE.fromIOEither,
      TE.map((content) => JSON.parse(content))
    );
  }

  return pipe(
    getChromePath(),
    TE.fromEither,
    TE.mapLeft(toAppError),
    TE.map((chromePath) => ({ ...defaultConf, chromePath }))
  );
};

export const setConfig = (
  basePath: string,
  c: GuardoniConfig
): TE.TaskEither<AppError, GuardoniConfig> => {
  const configFilePath = getConfigPath(basePath);
  return pipe(
    IOE.tryCatch(() => {
      return fs.writeFileSync(
        configFilePath,
        JSON.stringify(configFilePath),
        'utf-8'
      );
    }, toAppError),
    IOE.map(() => c),
    TE.fromIOEither
  );
};

export const getConfigWithDefaults =
  (ctx: { logger: GuardoniContext['logger'] }) =>
  (
    { yt, tk, ...conf }: GuardoniConfig,
    platform: Platform
  ): TE.TaskEither<AppError, GuardoniConfigRequired> => {
    ctx.logger.debug(
      'Get config with defaults %O for platform %s',
      { ...conf, yt, tk },
      platform
    );
    const platformConfigKey = getConfigPlatformKey(platform);

    // get platform specific config
    const platformConf =
      platformConfigKey === 'tk'
        ? {
            name: 'tiktok' as const,
            backend: DEFAULT_TK_BACKEND,
            extensionDir: DEFAULT_TK_EXTENSION_DIR,
            proxy: undefined,
            ...tk,
          }
        : {
            name: 'youtube' as const,
            backend: DEFAULT_YT_BACKEND,
            extensionDir: DEFAULT_YT_EXTENSION_DIR,
            proxy: undefined,
            ...yt,
          };

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

    const extensionDir = platformConf.extensionDir
      ? path.isAbsolute(platformConf.extensionDir)
        ? platformConf.extensionDir
        : path.resolve(process.cwd(), platformConf.extensionDir)
      : platformConfigKey === 'tk'
      ? DEFAULT_TK_EXTENSION_DIR
      : DEFAULT_YT_EXTENSION_DIR;

    ctx.logger.debug('Config: %O', {
      ...sanitizedConf,
      platform: {
        ...platformConf,
        extensionDir,
      },
    });

    return pipe(
      sequenceS(TE.ApplySeq)({
        chromePath: pipe(
          TE.fromEither(getChromePath()),
          TE.mapLeft(toAppError)
        ),
        profileName: checkProfile(ctx)(sanitizedConf),
      }),
      TE.map(({ profileName, chromePath }) => {
        const basePath = sanitizedConf.basePath
          ? path.resolve(process.cwd(), sanitizedConf.basePath)
          : DEFAULT_BASE_PATH;

        return {
          chromePath,
          evidenceTag,
          loadFor: DEFAULT_LOAD_FOR,
          profileName,
          basePath,
          ...sanitizedConf,
          publicKey: sanitizedConf.publicKey ?? '',
          platform: {
            ...platformConf,
            extensionDir,
          },
        };
      })
    );
  };

/**
 * Read and validate the profile from file path
 */
export const readProfile =
  (ctx: GuardoniContext) =>
  (profilePath: string): TE.TaskEither<AppError, GuardoniProfile> => {
    ctx.logger.debug('Reading profile from %s', profilePath);

    return pipe(
      liftFromIOE(() => fs.readFileSync(profilePath, 'utf-8')),
      TE.chain((data) =>
        pipe(
          Json.parse(data),
          E.mapLeft(
            (e) =>
              new AppError(
                'ReadProfileError',
                "Can't decode the content of the profile",
                [JSON.stringify(e)]
              )
          ),
          E.chain((d) =>
            pipe(
              GuardoniProfile.decode(d),
              E.mapLeft(
                (e) =>
                  new AppError(
                    'DecodeProfileError',
                    "Can't decode guardoni profile",
                    failure(e)
                  )
              )
            )
          ),
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
      readProfile(ctx)(ctx.guardoniConfigFile),
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
          liftFromIOE(() =>
            fs.writeFileSync(
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
    ctx.logger.info(
      'Running experiment %s with config %O',
      experimentId,
      ctx.config
    );
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
        values: [result],
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
  profileName: string
): GuardoniProfile => {
  return {
    udd: getProfileDataDir(basePath, profileName),
    newProfile: true,
    profileName,
    evidencetag: [],
    execount: 0,
  };
};

const loadContext = (
  p: typeof puppeteer,
  partialConfig: GuardoniConfig,
  platform: Platform,
  logger: GuardoniContext['logger']
): TE.TaskEither<AppError, GuardoniContext> => {
  logger.debug('Loading context for platform %s', platform);

  return pipe(
    getConfigWithDefaults({ logger })(partialConfig, platform),
    TE.map((config): GuardoniContext => {
      const profile = getDefaultProfile(config.basePath, config.profileName);

      logger.debug('profile %O', profile);

      return {
        puppeteer: p,
        API: GetAPI({
          baseURL: config.platform.backend,
          getAuth: async (req) => req,
          onUnauthorized: async (res) => res,
        }).API,
        config: {
          ...config,
          profileName: profile.profileName,
        },
        profile,
        logger,
        guardoniConfigFile: path.join(profile.udd, 'guardoni.json'),
        version: getPackageVersion(),
      };
    }),
    TE.chainFirst(downloadExtension),
    TE.chainFirst((ctx) =>
      liftFromIOE(() => fs.mkdirSync(ctx.profile.udd, { recursive: true }))
    ),
    TE.chain((ctx) =>
      pipe(
        liftFromIOE(() =>
          fs.statSync(ctx.guardoniConfigFile, { throwIfNoEntry: false })
        ),
        TE.chain((stat) => {
          ctx.logger.debug(
            'Path %s exists? %O',
            ctx.guardoniConfigFile,
            stat !== undefined
          );
          if (stat) {
            return readProfile(ctx)(ctx.guardoniConfigFile);
          }
          return pipe(
            liftFromIOE(() =>
              fs.writeFileSync(
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
  API: APIClient;
  // register an experiment from the given csv file
  registerExperimentFromCSV: (
    file: NonEmptyString,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  registerExperiment: (
    records: ComparisonDirectiveRow[],
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

export type GetGuardoni = ({
  config,
  logger,
}: {
  config: GuardoniConfig;
  platform: Platform;
  logger: GuardoniContext['logger'];
  puppeteer: typeof puppeteer;
}) => TE.TaskEither<AppError, Guardoni>;

export const GetGuardoni: GetGuardoni = ({
  config,
  platform,
  logger,
  puppeteer,
}): TE.TaskEither<AppError, Guardoni> => {
  const loggerSpaces = config.verbose
    ? ['guardoni:info', 'guardoni:debug', 'guardoni:error', process.env.DEBUG]
    : ['guardoni:info', 'guardoni:error', process.env.DEBUG];

  debug.enable(loggerSpaces.join(','));

  return pipe(
    loadContext(puppeteer, config, platform, logger),
    TE.map((ctx) => {
      return {
        config: ctx.config,
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
};
