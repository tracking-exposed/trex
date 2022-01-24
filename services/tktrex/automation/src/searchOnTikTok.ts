/* eslint-disable no-console */

import * as TE from 'fp-ts/lib/TaskEither';

import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

import copy from 'recursive-copy';

import { loadQueriesCSV } from './loadCSV';
import loadProfileState from './profileState';

import {
  ensureLoggedIn,
  handleCaptcha,
} from './tikTokUtil';

import {
  fileExists,
  fillInput,
  getExtBackupDir,
  prompt,
  setupBrowser,
  sleep,
  toError,
} from './util';

puppeteer.use(stealth());

export interface SearchOnTikTokOptions {
  chromePath: string;
  extensionSource?: string;
  file: string;
  url: string;
  profile: string;
  proxy?: string;
}

export const searchOnTikTok = ({
  chromePath,
  extensionSource,
  file,
  profile,
  proxy,
  url,
}: SearchOnTikTokOptions): TE.TaskEither<Error, Page> =>
  TE.tryCatch(async() => {
    const extBackupDir = getExtBackupDir(profile);
    const extPreviouslyInstalled = await fileExists(extBackupDir);
    const profileState = await loadProfileState(profile);

    console.log(
      `launching chrome from "${chromePath}" with profile "${profile}", which has been used ${
        profileState.getNTimesUsed() - 1
      } times before`,
    );

    const [page, extDir] = await setupBrowser({
      chromePath,
      extensionSource,
      profile,
      proxy,
    });

    if (!extensionSource && !extPreviouslyInstalled) {
      await prompt([
        '',
        'Please install the TikTok extension and press enter once done,',
        'or re-run this script providing an option for "extension-source".',
        '',
        'If you provide the "extension-source" option,',
        'you only need to do it once per profile.',
        '',
      ].join('\n'));
      // the other branch of that previous if is handled by the code in setupBrowser
    }

    await page.goto(url);
    await handleCaptcha(page);
    await ensureLoggedIn(page);

    const queries = await loadQueriesCSV(file);

    for (const query of queries) {
      console.log(`searching for "${query}"...`);

      await fillInput(
        page,
        '[data-e2e="search-user-input"',
        query,
      );
      await page.keyboard.press('Enter');
      await handleCaptcha(page);
      await sleep(5000);
    }

    if (extDir) {
      await copy(extDir, extBackupDir);
    }

    return page;
  }, toError);

export default searchOnTikTok;
