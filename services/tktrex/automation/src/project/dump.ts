import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { generateDirectoryStructure } from '.';

import { fileExists } from '@util/fs';
import createLogger from '@util/logger';
import { shellEscape } from '@util/misc';
import initDb from '@project/db';

interface RunOptions {
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

  await mkdir(metaDataDirectory, { recursive: true });

  const snapshots = await db.findAllSnapshots();
  await writeFile(
    join(metaDataDirectory, 'snapshots.json'),
    JSON.stringify(snapshots, null, 2),
  );

  logger.log('Dumped the meta data to:', shellEscape(metaDataDirectory));
};

export default dumpMetaData;
