/* eslint-disable no-console */

import { Page } from 'puppeteer';

import { loadQueriesCSV } from '../../util/csv';
import loadProfileState from '../../project/state';

import { ensureLoggedIn, handleCaptcha } from './util';

import { askConfirmation, fillInput, launchBrowser } from '../../util/page';

import { sleep } from '../../util/general';

export interface SearchOnTikTokOptions {
  chromePath: string;
  file: string;
  unpackedExtensionDirectory: string;
  url: string;
  profile: string;
  useStealth: boolean;
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
}: SearchOnTikTokOptions): Promise<Page> => {
  const profileState = await loadProfileState(profile);

  console.log(
    `Launching chrome from "${chromePath}" with profile "${profile}", which has been used ${
      profileState.getNTimesUsed() - 1
    } times before...\n`,
  );

  const page = await launchBrowser({
    chromePath,
    unpackedExtensionDirectory,
    profile,
    proxy,
    useStealth,
  });

  console.log('...launched chrome!\n');

  if (profileState.getNTimesUsed() === 1) {
    console.log('First time using this profile, so:\n');
    console.log('Please remember to resolve any kind of user interaction');
    console.log('that is not handled automatically in the browser!\n');
    console.log(
      'This script will attempt to warn you when it requires interaction.',
    );
    console.log('\n');
  }

  const confirm = askConfirmation(page);

  await page.goto(url);

  await handleCaptcha(page);

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
    console.log(`Searching for "${query}"...`);

    await fillInput(page, '[data-e2e="search-user-input"', query);
    await page.keyboard.press('Enter');
    await handleCaptcha(page);
    await sleep(5000);
  }

  return page;
};

export default searchOnTikTok;
