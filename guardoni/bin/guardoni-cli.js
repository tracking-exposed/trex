#!/usr/bin/env node

/* eslint-disable no-console */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { GetGuardoni } = require('../build/guardoni/guardoni.js');

const runGuardoni = ({ _, $0, v, headless, verbose, basePath, ...command }) => {
  console.log('run guardoni cli', { headless, verbose, basePath, command });
  return GetGuardoni({
    headless,
    verbose,
    basePath,
  })
    .cli(command)
    .runOrThrow()
    .then(() => process.exit(0));
};

yargs(hideBin(process.argv))
  .scriptName('guardoni-cli')
  .command(
    'experiment <experiment>',
    'Run guardoni from a given experiment',
    (yargs) =>
      yargs
        .positional('experiment', {
          desc: 'Experiment id',
          demandOption: 'Provide the experiment id',
          type: 'string',
        })
        .example('$0 experiment 1234'),
    (argv) => runGuardoni({ ...argv, run: 'experiment' })
  )
  .command(
    'register <file>',
    'Register an experiment from a CSV',
    (yargs) => {
      return yargs
        .positional('file', {
          desc: 'CSV file to register an experiment',
          type: 'string',
          demandOption: 'Provide a valid path to a csv file',
        })
        .example('$0 csv ./path/to/file.csv');
    },
    (argv) => runGuardoni({ ...argv, run: 'register' })
  )
  .usage(
    '$0 [index]',
    'Run guardoni in auto mode cli.',
    (yargs) => {
      return yargs.option('index', {
        type: 'string',
        choices: ['1', '2'],
        demandOption: 'Run comparison or shadow ban experiment run',
      });
    },
    (args) => runGuardoni({ ...args, run: 'auto' })
  )
  .example('$0 --type comparison')
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
  .option('proxy', {
    type: 'string',
    desc: 'Socket proxy for puppeteer.',
  })
  .options('advdump', {
    type: 'string',
    desc: 'ADV dump directory path',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    desc: 'Produce tons of logs',
    default: false,
  })
  .strictCommands()
  .parse();
