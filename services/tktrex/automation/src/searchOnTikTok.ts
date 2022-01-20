/* eslint-disable no-console */

import { join } from 'path';

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
  fillInput,
  prompt,
  setupBrowser,
  sleep,
  toError,
} from './util';

puppeteer.use(stealth());

export interface SearchOnTikTokOptions {
  chromePath: string;
  extensionSource: string;
  file: string;
  url: string;
  profile: string;
}

export const searchOnTikTok = ({
  chromePath,
  extensionSource,
  file,
  profile,
  url,
}: SearchOnTikTokOptions): TE.TaskEither<Error, Page> =>
  TE.tryCatch(async() => {
    const extBackupDir = join(profile, 'tx.tt.extension');
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
    });

    await page.goto(url);
    await handleCaptcha(page);
    await ensureLoggedIn(page);

    if (extensionSource === 'user-provided') {
      await prompt(
        'please install the TikTok extension and press enter once done, or re-run this script',
      );
      // the other branch of that previous if is handled by the code in setupBrowser
    }

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
