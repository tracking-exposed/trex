import { join } from 'path';
import { mkdir } from 'fs/promises';

import * as t from 'io-ts';

import { isEmptyDirectoryOrDoesNotExist } from '@util/fs';
import { shellEscape } from '@util/misc';
import { createLogger } from '@util/logger';
import experimentDescriptors from '@experiment/descriptors';

export const MinimalProjectConfig = t.type({
  experimentType: t.string,
  useStealth: t.boolean,
  proxy: t.union([t.null, t.string, t.undefined]),
  proxyUser: t.union([t.null, t.string, t.undefined]),
});
export type MinimalProjectConfig = t.TypeOf<typeof MinimalProjectConfig>;

export const generateDirectoryStructure = (
  projectDirectory: string,
): Record<string, string> => ({
  profileDirectory: join(projectDirectory, 'profile'),
  projectDirectory,
  extensionDirectory: join(projectDirectory, 'profile/tx.extension'),
  databaseDirectory: join(projectDirectory, 'database'),
  metaDataDirectory: join(projectDirectory, 'metaData'),
});

interface InitOptions {
  projectDirectory: string;
  experimentType: string;
}

/**
 * Create the basic project directory structure.
 *
 * Will copy the experiment's assets to the project directory.
 */
export const init = async({
  projectDirectory,
  experimentType,
}: InitOptions): Promise<void> => {
  const logger = createLogger();

  logger.log(
    `Initializing "${experimentType}" experiment in "${projectDirectory}"...`,
  );

  const ok = await isEmptyDirectoryOrDoesNotExist(projectDirectory);

  if (ok !== true) {
    const msg =
      ok === 'directory-not-empty'
        ? 'the directory is not empty'
        : 'the provided path is not a directory';

    logger.log(`..failed: ${msg}.`);
    throw new Error(`${msg}: "${projectDirectory}"`);
  }

  await mkdir(projectDirectory, { recursive: true });

  let initialized = false;
  for (const experiment of experimentDescriptors) {
    if (experiment.experimentType === experimentType) {
      await experiment.init({
        projectDirectory,
        logger,
      });
      initialized = true;
    }
  }

  if (!initialized) {
    throw new Error(`unknown experiment type: "${experimentType}"`);
  }

  logger.log(`...done initializing "${experimentType}" project!`);
  logger.log(
    'You can customize the experiment\'s settings by browsing the project\'s directory',
    'and editing the files it contains. A README.md file is also provided to help you.',
    '',
    'Once you\'re happy with the settings, to run the experiment,',
    'just execute the following command:',
    '',
    `yarn automate run ${shellEscape(projectDirectory)}`,
  );
};

export default init;
