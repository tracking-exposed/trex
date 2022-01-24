/* eslint-disable no-console */

import {
  mkdir,
} from 'fs/promises';

import {
  isEmptyDirectoryOrDoesNotExist,
  shellEscape,
} from './util';

import initTikTokProject from './tikTokProject';

export const experimentTypes = ['tt-french-elections'] as const;

export type ExperimentType = typeof experimentTypes[number];

export interface initOptions {
  directory: string;
  experimentType: string;
}

export const init = async({
  directory,
  experimentType,
}: initOptions): Promise<void> => {
  console.log(`Initializing "${experimentType}" experiment in "${directory}"...`);

  const ok = await isEmptyDirectoryOrDoesNotExist(directory);

  if (ok !== true) {
    const msg = ok === 'directory-not-empty'
      ? 'the directory is not empty'
      : 'the provided path is not a directory';

    console.log(`..failed: ${msg}.`);
    throw new Error(`${msg}: "${directory}"`);
  }

  await mkdir(directory, { recursive: true });

  switch (experimentType) {
  case 'tt-french-elections':
    await initTikTokProject({
      directory,
      experimentType,
    });
    break;
  default:
    throw new Error(`unknown experiment type: "${experimentType}"`);
  }

  console.log(`...done initializing "${experimentType}" project!`);
  console.log([
    '',
    'You can customize the experiment\'s settings by browsing the project\'s directory',
    'and editing the files it contains. A README.md file is also provided to help you.',
    '',
    'Once you\'re happy with the settings, to run the experiment,',
    'just execute the following command:',
    '',
    `yarn automate run ${shellEscape(directory)}`,
  ].join('\n'));
};

export default init;
