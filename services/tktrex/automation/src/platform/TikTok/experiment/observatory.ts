import * as t from 'io-ts';

import { ExperimentDescriptor } from '@experiment';
import { decodeOrThrow } from '@util/fp';

import { init } from '@TikTok/util/project';

import { MinimalProjectConfig } from '@project/init';
import { getAssetPath } from '../util/project';
import { flatCopyFiles } from '../../../util/fs';
import { sleep } from '@util/misc';

const Config = MinimalProjectConfig;
type Config = t.TypeOf<typeof Config>;

const experimentType = 'tt-observatory';

export const FrenchElections: ExperimentDescriptor = {
  experimentType,
  init: async({ projectDirectory }) => {
    await init({
      projectDirectory,
      experimentType,
    });
  },
  run: async({
    createPage,
    logger,
    projectDirectory,
    project: minimalConfig,
    saveSnapshot,
  }) => {
    const project = decodeOrThrow(Config)(minimalConfig);
    const page = await createPage({
      requiresExtension: false,
    });

    const fromDir = getAssetPath(project.experimentType);
    const toDir = projectDirectory;
    await flatCopyFiles(fromDir, toDir);

    await page.goto('https://www.tiktok.com');

    await sleep(1000);

    return page;
  },
};

export default FrenchElections;
