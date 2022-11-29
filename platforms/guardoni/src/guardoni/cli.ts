import { AppError } from '@shared/errors/AppError';
import D from 'debug';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import puppeteer, { PuppeteerExtra } from 'puppeteer-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { guardoniLogger } from '../logger';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_TK_BACKEND,
  DEFAULT_TK_EXTENSION_DIR,
  DEFAULT_YT_BACKEND,
  DEFAULT_YT_EXTENSION_DIR,
} from './constants';
import { DownloadExperimentOpts } from './experiment';
import { GetGuardoni } from './guardoni';
import {
  GuardoniConfig,
  GuardoniOutput,
  GuardoniSuccessOutput,
  Platform,
} from './types';
import { checkUpdate } from './update-notifier';

export const cliLogger = guardoniLogger.extend('cli');

export interface GuardoniCommandOpts {
  headless?: boolean;
  researchTag?: string;
  experimentId?: NonEmptyString;
  publicKey: string;
  secretKey: string;
}

export interface GuardoniNavigateOpts extends GuardoniCommandOpts {
  cookieModal?: {
    action: 'reject' | 'accept';
  };
  exit?: boolean;
}

export interface GuardoniCleanOpts {
  platform: Platform;
}

export type GuardoniCommandConfig =
  | {
      run: 'register-csv';
      file: NonEmptyString;
    }
  | {
      run: 'experiment';
      experiment: NonEmptyString;
      opts?: GuardoniCommandOpts;
    }
  | {
      run: 'download';
      experimentId: NonEmptyString;
      out: string;
      opts: DownloadExperimentOpts;
    }
  | {
      run: 'list';
    }
  | {
      run: 'navigate';
      opts: GuardoniNavigateOpts;
    }
  | {
      run: 'clean';
    };

export interface GuardoniCLI {
  run: (
    command: GuardoniCommandConfig
  ) => TE.TaskEither<AppError, GuardoniOutput>;
  runOrThrow: (command: GuardoniCommandConfig) => Promise<void>;
}

export type GetGuardoniCLI = (
  config: GuardoniConfig,
  basePath: string,
  p: PuppeteerExtra,
  platform: Platform
) => GuardoniCLI;

const foldOutput = (values: GuardoniSuccessOutput['values']): string[] => {
  return pipe(
    values,
    A.map((v) => {
      return Object.entries(v ?? []).map(([key, value]) => {
        // console.log({ key, value });
        if (Array.isArray(value)) {
          // console.log('value is array', value);
          const valuesChunk = value.map((v) => {
            return foldOutput([v]).map((o) => `\t ${o}`);
          });

          // NOTE: same consideration as below, this output
          // function should be tested based on what we need to see
          // otherwise a debug(%O) is enough for the guardoni-cli
          return [`${key}:\t`, ...A.flatten(valuesChunk)];
        }

        if (typeof value === 'object') {
          // console.log('value is object');

          // NOTE: I think this might be worthy of a chat.
          // instead of calling a recursive function, is domain knowledge in the
          // producer of this data, to decide how to format and handle results.

          // QUESTION: how many different input can exists for this function?
          // is it really necessary to make a generic output printer with a recursive function?

          // PROBABLY: console.table would do a nicer output
          return [`${key}: \n\t`, ...foldOutput([value])];
        }

        return [`${key}: \t ${value}`];
      });
    }),
    A.flatten,
    A.flatten
  );
};

const printOutput = (
  command: GuardoniCommandConfig,
  out: GuardoniOutput
): string => {
  const rest = out.type === 'success' ? foldOutput(out.values) : out.details;

  // console.log('rest', rest);
  return [
    '\n',
    `${command.run.slice(0, 1).toUpperCase()}${command.run.slice(1)} ${
      out.type === 'error' ? 'failed' : 'succeeded'
    }: ${out.message}`,
    '\n',
    rest.length > 0
      ? out.type === 'error'
        ? 'Error Details:\n'
        : 'Output values:\n'
      : null,
    ...rest,
  ].join('\n');
};

export const GetGuardoniCLI: GetGuardoniCLI = (
  config,
  basePath,
  p,
  platform
): GuardoniCLI => {
  const run = (
    command: GuardoniCommandConfig
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> =>
    pipe(
      GetGuardoni({
        basePath,
        logger: guardoniLogger,
        puppeteer: p,
        verbose: config.verbose,
      }).run(config, platform),
      TE.chainFirst((g) => checkUpdate(g.version, g.config.basePath)),
      TE.chain((g) => {
        return TE.fromIO<
          TE.TaskEither<AppError, GuardoniSuccessOutput>,
          AppError
        >(() => {
          cliLogger.debug('Running command %O', command);
          switch (command.run) {
            case 'list':
              return g.listExperiments();
            case 'register-csv': {
              return g.registerExperimentFromCSV(command.file);
            }
            case 'experiment':
              return g.runExperiment(command.experiment, command.opts);
            case 'navigate': {
              return pipe(
                g.runNavigate(command.opts),
                TE.map(() => ({
                  type: 'success',
                  values: [],
                  message: 'Navigation completed!',
                }))
              );
            }
            case 'clean':
              return pipe(
                g.cleanExtension(),
                TE.map(() => ({
                  type: 'success',
                  values: [],
                  message: 'Extension dir cleaned',
                }))
              );

            case 'download':
            default:
              return g.downloadExperiment(
                command.experimentId,
                command.out,
                command.opts
              );
          }
        });
      }),
      TE.flatten,
      TE.mapLeft((e) => {
        guardoniLogger.error(`Run error: %O`, e);
        return e;
      })
    );

  const runOrThrow = (command: GuardoniCommandConfig): Promise<void> =>
    pipe(
      run(command),
      TE.fold(
        (e) => () => {
          // eslint-disable-next-line
          console.log(
            printOutput(command, {
              type: 'error',
              message: e.message,
              details:
                e.details?.kind === 'DecodingError'
                  ? (e.details.errors as string[])
                  : [e.details.status],
            })
          );
          return Promise.reject(e);
        },
        (result) => () => {
          const output = printOutput(command, result);
          // eslint-disable-next-line
          console.log(output);
          return Promise.resolve();
        }
      )
    )();

  return {
    run,
    runOrThrow,
  };
};

const runGuardoni = ({
  _,
  $0,
  v,
  verbose,
  c,
  config,
  profile,
  backend: _backend,
  platform,
  command,
  extensionDir,
  'public-key': _publicKey,
  'secret-key': _secretKey,
  'cookie-modal': _cookiModal,
  'research-tag': _researchTag,
  'experiment-id': _experimentId,
  ...guardoniConf
}: any): Promise<void> => {
  const basePath = guardoniConf.basePath ?? DEFAULT_BASE_PATH;

  if (verbose) {
    D.enable('@trex*,guardoni*');
  }

  cliLogger.debug(
    'Running guardoni from base path %s%s: %O',
    basePath,
    config,
    guardoniConf
  );

  cliLogger.debug('Running command %O', command);

  return GetGuardoniCLI(
    {
      ...guardoniConf,
      basePath,
      yt: {
        ...guardoniConf.yt,
        name: 'youtube',
        backend: _backend ?? guardoniConf.yt?.backend ?? DEFAULT_YT_BACKEND,
        extensionDir:
          extensionDir ??
          guardoniConf.yt?.extensionDir ??
          DEFAULT_YT_EXTENSION_DIR,
      },
      tk: {
        ...guardoniConf.tk,
        name: 'tiktok',
        backend: _backend ?? guardoniConf.tk?.backend ?? DEFAULT_TK_BACKEND,
        extensionDir:
          extensionDir ??
          guardoniConf.tk?.extensionDir ??
          DEFAULT_TK_EXTENSION_DIR,
      },
      profileName: profile ?? guardoniConf.profileName ?? 'default',
      verbose,
    },
    basePath,
    puppeteer,
    platform
  )
    .runOrThrow(command)
    .then(() => process.exit(0));
};

const program = yargs(hideBin(process.argv))
  .scriptName('guardoni-cli')
  .command(
    'yt-navigate',
    'Use guardoni browser with loaded yt extension',
    (yargs) =>
      yargs
        .option('publicKey', {
          type: 'string',
          desc: 'The publicKey to use to collect evidences',
          default: undefined,
        })
        .option('secretKey', {
          type: 'string',
          desc: 'The secretKey to use to sign the evidences',
          default: undefined,
        })
        .option('experimentId', {
          type: 'string',
          desc: 'Setup the browser for the given experiment',
          default: undefined,
        })
        .option('cookie-modal', {
          type: 'string',
          choices: ['accept', 'reject'],
        })
        .option('exit', {
          type: 'boolean',
        }),
    ({ publicKey, secretKey, experimentId, researchTag, ...args }) => {
      void runGuardoni({
        ...args,
        headless: false,
        platform: 'youtube',
        command: {
          run: 'navigate',
          opts: { publicKey, secretKey, experimentId, researchTag },
        },
      });
    }
  )
  .command(
    'yt-experiment <experiment>',
    'Run guardoni from a given experiment',
    (yargs) =>
      yargs
        .positional('experiment', {
          desc: 'Experiment id',
          demandOption: 'Provide the experiment id',
          type: 'string',
        })
        .option('publicKey', {
          type: 'string',
          desc: 'The publicKey to use to collect evidences',
          default: undefined,
        })
        .option('secretKey', {
          type: 'string',
          desc: 'The secretKey to use to sign the evidences',
          default: undefined,
        }),
    ({ experiment, ...args }) => {
      void runGuardoni({
        ...args,
        platform: 'youtube',
        command: {
          run: 'experiment',
          experiment,
          opts: args,
        },
      });
    }
  )
  .command(
    'yt-register <file>',
    'Register an experiment from a CSV',
    (yargs) => {
      return yargs.positional('file', {
        desc: 'CSV file to register an experiment',
        type: 'string',
        demandOption: 'Provide a valid path to a csv file',
      });
    },
    ({ file, ...argv }) => {
      void runGuardoni({
        ...argv,
        platform: 'youtube',
        command: { run: 'register-csv', file },
      });
    }
  )
  .command(
    'yt-list',
    'List available experiments',
    (yargs) => {
      return yargs;
    },
    (argv) => {
      void runGuardoni({
        ...argv,
        platform: 'youtube',
        command: { run: 'list' },
      });
    }
  )
  .command(
    'yt-clean',
    'Clean YT extension',
    (yargs) => yargs,
    (argv) => {
      void runGuardoni({
        ...argv,
        platform: 'youtube',
        command: { run: 'clean' },
      });
    }
  )
  .command(
    'tk-navigate',
    'Use guardoni browser with loaded tk extension',
    (yargs) =>
      yargs
        .option('publicKey', {
          type: 'string',
          desc: 'The publicKey to use to collect evidences',
          default: undefined,
        })
        .option('secretKey', {
          type: 'string',
          desc: 'The secretKey to use to sign the evidences',
          default: undefined,
        }),
    ({ publicKey, secretKey, ...argv }) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: {
          run: 'navigate',
          opts: { publicKey, secretKey },
        },
      });
    }
  )
  .command(
    'tk-experiment <experiment>',
    'Run guardoni from a given experiment',
    (yargs) =>
      yargs
        .positional('experiment', {
          desc: 'Experiment id',
          demandOption: 'Provide the experiment id',
          type: 'string',
        })
        .option('publicKey', {
          type: 'string',
          desc: 'The publicKey to use to collect evidences',
          default: undefined,
        })
        .option('secretKey', {
          type: 'string',
          desc: 'The secretKey to use to sign the evidences',
          default: undefined,
        }),
    ({ experiment, publicKey, secretKey, ...argv }) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: {
          run: 'experiment',
          experiment,
          opts: { publicKey, secretKey },
        },
      });
    }
  )
  .command(
    'tk-register <file>',
    'Register an experiment from a CSV',
    (yargs) => {
      return yargs.positional('file', {
        desc: 'CSV file to register an experiment',
        type: 'string',
        demandOption: 'Provide a valid path to a csv file',
      });
    },
    ({ file, $0, _, ...argv }) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: { run: 'register-csv', file },
      });
    }
  )
  .command(
    'tk-list',
    'List available experiments',
    (yargs) => yargs,
    (argv) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: { run: 'list' },
      });
    }
  )
  .command(
    'tk-download [experimentId] [out]',
    'Download all the data collected in an experiment',
    (y) =>
      y
        .positional('experimentId', {
          description: 'The experiment id',
        })
        .positional('out', {
          description: 'The folder where to store the output files',
        })
        .option('metadata', {
          description: 'Custom filename for metadata file',
        })
        .option('api-requests', {
          description: 'Custom filename for API Request file',
        }),
    ({ experimentId, out, metadata, apiRequests, ...argv }) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: {
          run: 'download',
          experimentId,
          out,
          opts: { metadata, apiRequests },
        },
      });
    }
  )
  .command(
    'tk-clean',
    'Clean TK extension',
    (yargs) => yargs,
    (argv) => {
      void runGuardoni({
        ...argv,
        platform: 'tiktok',
        command: { run: 'clean' },
      });
    }
  )
  .command(
    'tk-init [projectDirectory]',
    'Initialize an experiment directory',
    (y) =>
      y
        .positional('projectDirectory', {
          default: '.',
          desc: 'Directory to initialize, current directory if empty',
          type: 'string',
        })
        .option('experiment-type', {
          alias: 't',
          demandOption: true,
          desc: 'Type of experiment to initialize (e.g. "search-on-tiktok")',
          type: 'string',
          default: '',
          choices: [],
        }),
    (args) => {
      void Promise.reject(new Error('Not implemented'));
    }
  )
  .command(
    'tk-run [projectDirectory]',
    'Run an experiment from a directory previously initialized',
    (y) =>
      y.positional('projectDirectory', {
        default: '.',
        desc: 'Directory containing the initialized experiment to run, current directory if empty',
        type: 'string',
      }),
    (args) => {
      void Promise.reject(new Error('Not implemented'));
    }
  )
  .command(
    'tk-dump [projectDirectory]',
    'Dump meta data from an experiment directory',
    (y) =>
      y.positional('projectDirectory', {
        default: '.',
        desc: 'Directory containing the experiment from which to dump the meta data',
        type: 'string',
      }),
    (args) => {
      void Promise.reject(new Error('Not implemented'));
    }
  )
  .option('c', {
    type: 'string',
    alias: 'config',
    desc: 'Guardoni configuration',
    default: 'guardoni.config.json',
    config: true,
  })
  .config()
  .option('headless', {
    type: 'boolean',
    desc: 'Run guardoni in headless mode.',
    default: false,
  })
  .option('researchTag', {
    type: 'string',
    desc: 'The evidence related tag.',
  })
  .option('profile', {
    type: 'string',
    desc: 'The current user profile',
  })
  .option('backend', {
    type: 'string',
    desc: 'The API endpoint for server requests',
  })
  .option('proxy', {
    type: 'string',
    desc: 'Socket proxy for puppeteer.',
  })
  .option('adv-screenshot-dir', {
    type: 'string',
    desc: 'ADV screenshot directory path',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    desc: 'Produce tons of logs',
    default: false,
  });

export const cli = program.strictCommands().demandCommand(1);
