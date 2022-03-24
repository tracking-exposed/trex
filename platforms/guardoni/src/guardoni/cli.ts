import { AppError } from '@shared/errors/AppError';
import { DirectiveType } from '@shared/models/Directive';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';
import { guardoniLogger } from '../logger';
import { GetGuardoni } from './guardoni';
import { GuardoniConfig, GuardoniOutput, GuardoniSuccessOutput } from './types';
import puppeteer from 'puppeteer-core';
import { run } from './tx-automate/project/run';
import { init } from './tx-automate/project/init';
import { dumpMetaData } from './tx-automate/project/dump';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { experimentTypes } from './tx-automate/experiment/descriptors';

export const tkAutomate = { run, init, dumpMetaData };

export const cliLogger = guardoniLogger.extend('cli');

export type GuardoniCommandConfig =
  | {
      run: 'register-csv';
      file: NonEmptyString;
      type?: DirectiveType;
    }
  | {
      run: 'experiment';
      experiment: NonEmptyString;
    }
  | {
      run: 'auto';
      value: '1' | '2';
    }
  | {
      run: 'list';
    };

export interface GuardoniCLI {
  run: (
    command: GuardoniCommandConfig
  ) => TE.TaskEither<AppError, GuardoniOutput>;
  runOrThrow: (command: GuardoniCommandConfig) => Promise<void>;
}

export type GetGuardoniCLI = (
  config: GuardoniConfig,
  p: typeof puppeteer
) => GuardoniCLI;

const foldOutput = (
  command: GuardoniCommandConfig,
  out: GuardoniOutput
): string => {
  const rest =
    out.type === 'success'
      ? pipe(
          out.values,
          A.map((v) => {
            return Object.entries(v).map(([key, value]) => {
              if (typeof value === 'string') {
                return [`${key}: ${value}`];
              }

              const valuesChunk = Object.entries(value).map(
                ([key, value]) => `${key}: ${JSON.stringify(value)}`
              );

              return [`${key}: \n\t`, ...valuesChunk];
            });
          }),
          A.flatten
        )
      : out.details;

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

export const GetGuardoniCLI: GetGuardoniCLI = (config, p): GuardoniCLI => {
  cliLogger.debug('Initialized with config %O', config);

  const run = (
    command: GuardoniCommandConfig
  ): TE.TaskEither<AppError, GuardoniSuccessOutput> =>
    pipe(
      GetGuardoni({ config, logger: guardoniLogger, puppeteer: p }),
      TE.chain((g) => {
        return TE.fromIO<
          TE.TaskEither<AppError, GuardoniSuccessOutput>,
          AppError
        >(() => {
          cliLogger.debug('Running command %O', command);
          switch (command.run) {
            case 'list':
              return g.listExperiments();
            case 'register-csv':
              return g.registerExperimentFromCSV(
                command.file,
                command.type ?? 'comparison'
              );
            case 'experiment':
              return g.runExperiment(command.experiment);
            case 'auto':
            default:
              return g.runAuto(command.value);
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
            foldOutput(command, {
              type: 'error',
              message: e.message,
              details: e.details,
            })
          );
          return Promise.reject(e);
        },
        (result) => () => {
          // eslint-disable-next-line
          console.log(foldOutput(command, result));
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
  command,
  ...guardoniConf
}: any): Promise<void> => {
  if (verbose) {
    if (config) {
      console.log(`Configuration loaded from ${config}`, guardoniConf);
    }
  }

  return GetGuardoniCLI({ ...guardoniConf, verbose }, puppeteer)
    .runOrThrow(command)
    .then(() => process.exit(0));
};

const program = yargs(hideBin(process.argv))
  .scriptName('guardoni-cli')
  .command(
    'yt-experiment <experiment>',
    'Run guardoni from a given experiment',
    (yargs) =>
      yargs.positional('experiment', {
        desc: 'Experiment id',
        demandOption: 'Provide the experiment id',
        type: 'string',
      }),
    ({ experiment, ...argv }) =>
      runGuardoni({ ...argv, command: { run: 'experiment', experiment } })
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
    ({ file, ...argv }) =>
      runGuardoni({ ...argv, command: { run: 'register-csv', file } })
  )
  .command(
    'yt-list',
    'List available experiments',
    (yargs) => {
      return yargs;
    },
    (argv) => runGuardoni({ ...argv, command: { run: 'list' } })
  )
  .command(
    'yt-auto <index>',
    'YT automatic mode',
    (yargs) =>
      yargs.positional('index', {
        type: 'string',
        choices: ['1', '2'],
        demandOption: 'Run comparison or shadow ban experiment run',
      }),
    ({ index, ...argv }) =>
      runGuardoni({ ...argv, command: { run: 'auto', index } })
  )
  .command(
    'tk-init [projectDirectory]',
    'TK: Initialize an experiment directory',
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
          default: experimentTypes[0],
          choices: experimentTypes,
        }),
    (args) => init(args)
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
    (args) => run(args)
  )
  .command(
    'tk-dump [projectDirectory]',
    'TK: Dump meta data from an experiment directory',
    (y) =>
      y.positional('projectDirectory', {
        default: '.',
        desc: 'Directory containing the experiment from which to dump the meta data',
        type: 'string',
      }),
    (args) => dumpMetaData(args)
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
  .option('evidenceTag', {
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
  .options('adv-screenshot-dir', {
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