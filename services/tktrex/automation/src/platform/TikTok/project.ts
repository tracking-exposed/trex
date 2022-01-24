import { join, resolve } from 'path';

import { createReadStream } from 'fs';

import { mkdir } from 'fs/promises';

import * as t from 'io-ts';
import * as E from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import unzipper from 'unzipper';

import { getChromePath } from '@guardoni/guardoni/utils';

import { ExperimentType } from '../../project/init';
import searchOnTikTok from './search';

import { copyFromTo } from '../../util/general';

const getAssetPath = (path: string): string =>
  resolve(__dirname, '../assets/TikTok', path);

const Config = t.type(
  {
    experimentType: t.literal('tt-french-elections'),
    proxy: t.union([t.null, t.string]),
    baseURL: t.string,
    useStealth: t.boolean,
  },
  'Config',
);
type Config = t.TypeOf<typeof Config>;

export interface InitOptions {
  directory: string;
  experimentType: ExperimentType;
}

export const init = async({
  directory,
  experimentType,
}: InitOptions): Promise<void> => {
  const profileDirectory = join(directory, 'profile');
  const extensionDirectory = join(profileDirectory, 'tx.extension');
  await mkdir(extensionDirectory, { recursive: true });

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

export interface RunOptions {
  directory: string;
  rawConfig: unknown;
}

export const run = async({
  directory,
  rawConfig,
}: RunOptions): Promise<void> => {
  const maybeConfig = Config.decode(rawConfig);

  if (E.isLeft(maybeConfig)) {
    const errors = PathReporter.report(maybeConfig);
    throw new Error(`invalid config:\n${errors.join('\n')}`);
  }

  const config = maybeConfig.right;

  return runFrenchElectionsMonitoring(config, directory);
};

const runFrenchElectionsMonitoring = async(
  config: Config,
  directory: string,
): Promise<void> => {
  const maybeChromePath = getChromePath();

  if (E.isLeft(maybeChromePath)) {
    throw maybeChromePath.left;
  }

  const chromePath = maybeChromePath.right;

  await searchOnTikTok({
    chromePath,
    file: join(directory, 'queries.csv'),
    profile: resolve(directory, 'profile'),
    unpackedExtensionDirectory: resolve(directory, 'profile/tx.extension'),
    proxy: config.proxy,
    url: config.baseURL,
    useStealth: config.useStealth,
  });
};

export default init;
