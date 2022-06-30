import { readFile } from 'fs/promises';
import { join } from 'path';

import yaml from 'yaml';

import { getChromePath } from '@guardoni/guardoni/utils';

import { generateDirectoryStructure } from '@project/init';

import { decodeOrThrow, rightOrThrow } from '@util/fp';
import { fileExists } from '@util/fs';
import createLogger from '@util/logger';
import { createPage } from '@util/page';
import initDb, { BaseModel, StorableValue } from '@storage/db';

import experimentDescriptors, {
  experimentTypes,
} from '@experiment/descriptors';
import { MinimalProjectConfig } from '../config';

export interface RunOptions {
  projectDirectory: string;
}

export const run = async({ projectDirectory }: RunOptions): Promise<void> => {
  const db = await initDb(projectDirectory);

  const logger = createLogger();
  const configPath = join(projectDirectory, 'config.yaml');

  if (!(await fileExists(configPath))) {
    throw new Error(
      `"config.yaml" not found in "${projectDirectory}", was the project initialized?`,
    );
  }

  const rawConfig = yaml.parse(await readFile(configPath, 'utf8'));

  if (!experimentTypes.includes(rawConfig.experimentType)) {
    throw new Error(`unknown experiment type: "${rawConfig.experimentType}"`);
  }

  const project = decodeOrThrow(MinimalProjectConfig)(rawConfig);

  logger.log(
    `Running "${rawConfig.experimentType}" experiment in "${projectDirectory}"...`,
  );

  logger.log('Full project raw configuration:', project);

  const { profileDirectory, extensionDirectory } =
    generateDirectoryStructure(projectDirectory);

  const chromePath = rightOrThrow(getChromePath());

  let foundExperiment = false;
  for (const experiment of experimentDescriptors) {
    if (experiment.experimentType === rawConfig.experimentType) {
      foundExperiment = true;

      const page = await createPage({
        chromePath,
        profileDirectory,
        extensionDirectory,
        proxy: project.proxy,
        useStealth: project.useStealth,
        logger,
      });

      const saveSnapshot = async(
        metaData: StorableValue,
        parser: (html: string) => BaseModel[] | Promise<BaseModel[]>,
      ): Promise<void> => {
        const snap = {
          type: 'Snapshot',
          experimentType: rawConfig.experimentType,
          url: page.url(),
          html: await page.content(),
          metaData,
        };

        const s = await db.save(snap);

        const scrapedItems = (await parser(snap.html)).map((p) => {
          if (!p || typeof p !== 'object') {
            throw new Error(
              `parser returned invalid object: ${JSON.stringify(p)}`,
            );
          }

          const item = {
            ...p,
            snapshotId: s._id,
          };

          return item;
        });

        await db.saveMany(scrapedItems);
      };

      await experiment.run({
        projectDirectory,
        logger,
        page,
        project,
        saveSnapshot,
      });

      await page.browser().close();

      logger.log('', '...done running experiment, with success!');
    }
  }

  if (!foundExperiment) {
    throw new Error(`unknown experiment type: "${rawConfig.experimentType}"`);
  }
};

export default run;
