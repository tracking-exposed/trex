import { Page } from 'puppeteer';

import { loadQueriesCSV } from '../../util/csv';
import loadProfileState from '../../project/state';

import { ensureLoggedIn, createHandleCaptcha } from './util';

import { askConfirmation, fillInput, createPage } from '../../util/page';

import { sleep } from '../../util/general';
import { Logger } from '../../util/logger';

export interface SearchOnTikTokOptions {
  chromePath: string;
  file: string;
  unpackedExtensionDirectory: string;
  url: string;
  profile: string;
  useStealth: boolean;
  logger: Logger;
  proxy?: string | null;
}

export const searchOnTikTok = async({
  chromePath,
  file,
  profile,
  proxy,
  unpackedExtensionDirectory,
  url,
  useStealth,
  logger,
}: SearchOnTikTokOptions): Promise<Page> => {
  const profileState = await loadProfileState(profile);

  logger.log(
    `Launching chrome from "${chromePath}" with profile "${profile}", which has been used ${
      profileState.getNTimesUsed() - 1
    } times before...\n`,
  );

  const page = await createPage({
    chromePath,
    unpackedExtensionDirectory,
    profile,
    proxy,
    useStealth,
  });

  logger.log('...launched chrome!\n');

  const handleCaptcha = createHandleCaptcha(page, logger);

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

  const confirm = askConfirmation(page);

  await page.goto(url);
  await handleCaptcha();
  await ensureLoggedIn(page);

  if (profileState.getNTimesUsed() === 1) {
    await confirm(
      'It looks like you\'re running this experiment for the first time.',
      '',
      'Please remember to take note of your public key from your personal page.',
      'This page can be accessed from the extension menu.',
    );
  }

  const queries = await loadQueriesCSV(file);

  for (const query of queries) {
    logger.log(`Searching for "${query}"...`);

    await fillInput(page, '[data-e2e="search-user-input"', query);
    await page.keyboard.press('Enter');
    await handleCaptcha();
    await sleep(5000);
  }

  return page;
};

export default searchOnTikTok;
