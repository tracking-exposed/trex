import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { generateDirectoryStructure } from '@project/init';

import { fileExists } from '@util/fs';
import createLogger from '@util/logger';
import { shellEscape } from '@util/misc';
import initDb from '@storage/db';

export interface RunOptions {
  projectDirectory: string;
}

export const dumpMetaData = async({
  projectDirectory,
}: RunOptions): Promise<void> => {
  const db = await initDb(projectDirectory);
  const logger = createLogger();
  const configPath = join(projectDirectory, 'config.yaml');

  if (!(await fileExists(configPath))) {
    throw new Error(
      `"config.yaml" not found in "${projectDirectory}", was the project initialized?`,
    );
  }

  const { metaDataDirectory } = generateDirectoryStructure(projectDirectory);

  const dumpCollection = async(type: string): Promise<void> => {
    const models = await db.findMany(type);
    return writeFile(
      join(metaDataDirectory, `${type}.json`),
      JSON.stringify(models, null, 2),
    );
  };

  await mkdir(metaDataDirectory, { recursive: true });

  const collections = ['Snapshot', 'SearchTopMetaData'];
  await Promise.all(collections.map(dumpCollection));

  logger.log(
    `Dumped collections "${collections.join(', ')}" to:`,
    shellEscape(metaDataDirectory),
  );
};

export default dumpMetaData;
