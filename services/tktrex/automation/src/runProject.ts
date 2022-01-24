/* eslint-disable no-console */

import { readFile } from 'fs/promises';
import { join } from 'path';

import yaml from 'yaml';

import { fileExists } from './util';
import { run as tikTokRun } from './tikTokProject';
import { experimentTypes } from './initProject';

const exit = (message: string, code = 0): never => {
  if (code === 0) {
    console.log(`Finished with success: ${message}.`);
  } else {
    console.error(`Finished with error: ${message}.`);
  }
  process.exit(code);
};

export interface RunOptions {
  directory: string;
}

export const run = async({ directory }: RunOptions): Promise<void> => {
  const configPath = join(directory, 'config.yaml');

  if (!(await fileExists(configPath))) {
    throw new Error(
      `config.yaml not found in "${directory}", was the project initialized?`,
    );
  }

  const rawConfig = yaml.parse(await readFile(configPath, 'utf8'));

  if (!experimentTypes.includes(rawConfig.experimentType)) {
    throw new Error(`unknown experiment type: "${rawConfig.experimentType}"`);
  }

  console.log(
    `Running "${rawConfig.experimentType}" experiment in "${directory}"...`,
  );

  if (rawConfig.experimentType.startsWith('tt-')) {
    await tikTokRun({
      directory,
      rawConfig,
    });

    exit('done running experiment');
  }

  throw new Error(`unknown experiment type: "${rawConfig.experimentType}"`);
};

export default run;
