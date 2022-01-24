import { join, resolve } from 'path';

import { createReadStream } from 'fs';

import { mkdir } from 'fs/promises';

import * as t from 'io-ts';
import * as E from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { Page } from 'puppeteer';
import unzipper from 'unzipper';

import { getChromePath } from '@guardoni/guardoni/utils';

import { RunOptions } from '../../project';
import { ExperimentType } from '../../project/init';
import searchOnTikTok from './search';

import createLogger, { Logger } from '../../util/logger';
import { copyFromTo } from '../../util/general';
import { createPage as baseCreatePage } from '../../util/page';

const getAssetPath = (path: string): string =>
  resolve(__dirname, '../../../assets/TikTok', path);

export const Config = t.type(
  {
    experimentType: t.literal('tt-french-elections'),
    proxy: t.union([t.null, t.string]),
    baseURL: t.string,
    useStealth: t.boolean,
  },
  'Config',
);
export type Config = t.TypeOf<typeof Config>;

export interface InitOptions {
  directory: string;
  experimentType: ExperimentType;
}

export const generateDirectoryStructure = (
  projectDirectory: string,
): Record<string, string> => ({
  profileDirectory: join(projectDirectory, 'profile'),
  projectDirectory,
  extensionDirectory: join(projectDirectory, 'profile/tx.extension'),
});

export const init = async({
  directory,
  experimentType,
}: InitOptions): Promise<void> => {
  const { extensionDirectory, profileDirectory } =
    generateDirectoryStructure(directory);

  await mkdir(extensionDirectory, { recursive: true });
  await mkdir(profileDirectory, { recursive: true });

  const extZipPath = getAssetPath('tktrex-extension-0.2.6.zip');

  const stream = createReadStream(extZipPath).pipe(
    unzipper.Extract({
      path: extensionDirectory,
    }),
  );

  await new Promise((resolve, reject) => {
    stream.on('close', resolve);
    stream.on('error', reject);
  });

  if (experimentType !== 'tt-french-elections') {
    throw new Error(`unknown experiment type: "${experimentType}"`);
  }

  const cp = copyFromTo(getAssetPath('.'), directory);

  await cp({
    'french-elections-monitoring-config.yaml': 'config.yaml',
    'french-elections-monitoring-queries.csv': 'queries.csv',
    'search.README.md': 'README.md',
  });
};

interface BasicRunOptions {
  directory: string;
  rawConfig: unknown;
}

export const run = async({
  directory,
  rawConfig,
}: BasicRunOptions): Promise<Page> => {
  const logger = createLogger();
  const maybeConfig = Config.decode(rawConfig);

  if (E.isLeft(maybeConfig)) {
    const errors = PathReporter.report(maybeConfig);
    throw new Error(`invalid config:\n${errors.join('\n')}`);
  }

  const config = maybeConfig.right;

  return runFrenchElectionsMonitoring(config, logger, directory);
};

const runFrenchElectionsMonitoring = (
  project: Config,
  logger: Logger,
  projectDirectory: string,
): Promise<Page> => {
  const maybeChromePath = getChromePath();

  if (E.isLeft(maybeChromePath)) {
    throw maybeChromePath.left;
  }

  const chromePath = maybeChromePath.right;

  const { profileDirectory, extensionDirectory } =
    generateDirectoryStructure(projectDirectory);

  const createPage = (): Promise<Page> =>
    baseCreatePage({
      chromePath,
      profileDirectory,
      extensionDirectory,
      useStealth: project.useStealth,
      proxy: project.proxy,
    });

  const run: RunOptions = {
    logger,
    projectDirectory,
    profileDirectory,
    createPage,
  };

  return searchOnTikTok({
    project,
    run,
  });
};

export default init;
