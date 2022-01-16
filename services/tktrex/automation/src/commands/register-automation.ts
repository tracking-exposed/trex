import { readFile } from 'fs/promises';

import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import parseCSV from 'csv-parse/lib/sync';

import { Command, CommandConfig } from '../models/Command';
import {
  AutomationScenario,
  SearchStep,
} from '@shared/models/Automation';

import { GetAPI } from '@shared/providers/api.provider';

export const recordToStep = (record: Record<string, string>): SearchStep => {
  if (Object.keys(record).length !== 1) {
    throw new Error('invalid record, expected 1 column only');
  }

  if (!record.query) {
    throw new Error('invalid record, expected a "query" column');
  }

  return {
    type: 'search',
    platform: 'tiktok',
    platformURL: 'https://tiktok.com/fr',
    query: record.query,
  };
};

export const registerAutomation =
  (config: CommandConfig) =>
    async({
      type,
      file,
      description,
      label,
    }: {
      type: string;
      file: string;
      description?: string;
      label?: string;
    }): Promise<void> => {
      config.log.info('Registering automation for "%s"...', type);

      if (type !== 'tiktok-fr-elections') {
        throw new Error(`Unsupported automation type: ${type}`);
      }

      const fileContents = await readFile(file, 'utf8');

      const records = parseCSV(fileContents, {
        columns: true,
        skip_empty_lines: true,
      });

      if (!(records instanceof Array)) {
        throw new Error('invalid records, expected an array');
      }

      config.log.info('Found %d records', records.length);

      const steps = records.map(recordToStep);

      const scenario: AutomationScenario = {
        type,
        description,
        label,
        script: steps,
        // createdAt: new Date(),
      };

      const { API } = GetAPI({
        baseURL: config.API_BASE_URL,
      });

      const endpoint = API.automation.v0.CreateScenario;

      void pipe(
        {
          Body: scenario,
        },
        endpoint,
        // eslint-disable-next-line array-callback-return
        TE.map(() => {
          config.log.info('Automation registered');
        }),
        TE.mapLeft((error) => {
          config.log.error('Automation registration failed');
          config.log.error('%o', error);
        }),
      )();
    };

export const registerAutomationCommand: Command = {
  add: (config) => (yargs) =>
    yargs.command(
      'register <file>',
      'Register an automation file',
      (y) =>
        y
          .positional('file', {
            demandOption: true,
            desc: 'File containing one automation step per line',
            type: 'string',
          })
          .option('description', {
            alias: 'd',
            desc: 'Save a comment together with this automation',
            type: 'string',
          })
          .option('label', {
            alias: 'l',
            desc: 'Save a label together with this automation',
            type: 'string',
          })
          .option('type', {
            alias: 't',
            desc: 'Automation type',
            type: 'string',
            demandOption: true,
            choices: ['tiktok-fr-elections'],
          }),
      async(argv) => registerAutomation(config)(argv),
    ),
};

export default registerAutomationCommand;
