import { resolve } from 'path';
import { createReadStream } from 'fs';
import { mkdir } from 'fs/promises';

import { Page } from 'puppeteer-core';
import unzipper from 'unzipper';

import { generateDirectoryStructure } from '@project/init';
import { flatCopyFiles } from '@util/fs';
import { Logger } from '@util/logger';
import { askConfirmation } from '@util/page';
import { ProfileState } from '@project/state';

export const getAssetPath = (path: string): string =>
  // TODO: this is brittle
  resolve(process.cwd(), 'assets/TikTok', path);

interface InitOptions {
  projectDirectory: string;
  experimentType: string;
}

export const init = async({
  projectDirectory,
  experimentType,
}: InitOptions): Promise<void> => {
  const { extensionDirectory, profileDirectory } =
    generateDirectoryStructure(projectDirectory);

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

  await flatCopyFiles(getAssetPath(experimentType), projectDirectory);
};

export const showBasicInfo = (
  logger: Logger,
  profileState: ProfileState,
): void => {
  if (profileState.getNTimesUsed() === 1) {
    logger.log(
      'First time using this profile, so:',
      '',
      '> Please remember to resolve any kind of user interaction',
      '> that is not handled automatically in the browser!',
      '',
      'This script will attempt to warn you when it requires human interaction.',
    );
  }
};

export const confirmPublicKeyNoted = async(
  page: Page,
  profileState: ProfileState,
): Promise<void> => {
  if (profileState.getNTimesUsed() === 1) {
    const confirm = askConfirmation(page);

    await confirm(
      'It looks like you\'re running this experiment for the first time.',
      '',
      'Please remember to take note of your public key from your personal page.',
      'This page can be accessed from the extension menu.',
    );
  }
};

export default init;
