#!/usr/bin/env node

/* eslint-disable no-console */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { GetGuardoniCLI } = require('../build/guardoni/cli.js');
const puppeteer = require('puppeteer-extra');

const runGuardoni = ({
  _,
  $0,
  v,
  verbose,
  c,
  config,
  command,
  ...guardoniConf
}) => {
  if (verbose) {
    if (config) {
      console.log(`Configuration loaded from ${config}`, guardoniConf);
    }
  }

  return GetGuardoniCLI({ ...guardoniConf, verbose }, puppeteer)
    .runOrThrow(command)
    .then(() => process.exit(0));
};

yargs(hideBin(process.argv))
  .scriptName('guardoni-cli')
  .example('$0 --type comparison')
  .command(
    'experiment <experiment>',
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
    'register <file>',
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
    'list',
    'List available experiments',
    (yargs) => {
      return yargs.example('$0 list');
    },
    (argv) => runGuardoni({ ...argv, command: { run: 'list' } })
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
    ({ index, ...args }) =>
      runGuardoni({ ...args, command: { run: 'auto', index: index } })
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
  })
  .strictCommands().argv;
