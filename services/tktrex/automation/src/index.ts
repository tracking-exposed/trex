import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { experimentTypes } from '@experiment/descriptors';
import init from '@project/init';
import run from '@project/run';
import dumpMetaData from '@project/dump';

const menu = yargs(hideBin(process.argv))
  .scriptName('tktrex-automation')
  .command(
    'init [projectDirectory]',
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
          choices: experimentTypes,
        }),
    (args) => init(args),
  )
  .command(
    'run [projectDirectory]',
    'Run an experiment from a directory previously initialized',
    (y) =>
      y.positional('projectDirectory', {
        default: '.',
        desc: 'Directory containing the initialized experiment to run, current directory if empty',
        type: 'string',
      }),
    (args) => run(args),
  )
  .command(
    'dump-meta-data [projectDirectory]',
    'Dump meta data from an experiment directory',
    (y) =>
      y.positional('projectDirectory', {
        default: '.',
        desc: 'Directory containing the experiment from which to dump the meta data',
        type: 'string',
      }),
    (args) => dumpMetaData(args),
  );

void menu.strictCommands().demandCommand(1, 'Please provide a command').parse();
