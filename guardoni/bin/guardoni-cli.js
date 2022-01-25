#!/usr/bin/env node

/* eslint-disable no-console */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { GetGuardoniCLI } = require('../build/guardoni/cli.js');

const runGuardoni = ({
  _,
  $0,
  v,
  headless,
  verbose,
  backend,
  basePath,
  profile,
  evidenceTag,
  proxy,
  ...command
}) => {
  return GetGuardoniCLI({
    headless,
    basePath,
    profile,
    verbose,
    evidenceTag,
    proxy,
    backend,
  })
    .runOrThrow(command)
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
    (argv) => runGuardoni({ ...argv, run: 'register-csv' })
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
  })
  .strictCommands()
  .parse();
