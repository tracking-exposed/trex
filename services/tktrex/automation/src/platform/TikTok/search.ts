import { join } from 'path';

import { Page } from 'puppeteer';

import { loadQueriesCSV } from '../../util/csv';
import loadProfileState from '../../project/state';

import { ensureLoggedIn, createHandleCaptcha } from './util';

import { askConfirmation, fillInput } from '../../util/page';

import { sleep } from '../../util/general';

import { RunOptions } from '../../project';

import { Config as ProjectConfig } from './project';

export interface SearchOnTikTokOptions {
  run: RunOptions;
  project: ProjectConfig;
}

export const searchOnTikTok = async({
  run: { createPage, logger, profileDirectory, projectDirectory },
  project: { baseURL },
}: SearchOnTikTokOptions): Promise<Page> => {
  const profileState = await loadProfileState(profileDirectory);
  const page = await createPage(profileDirectory);
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

  await page.goto(baseURL);
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

  // TODO: how can this be made type safe?
  const queries = await loadQueriesCSV(join(projectDirectory, 'queries.csv'));

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
