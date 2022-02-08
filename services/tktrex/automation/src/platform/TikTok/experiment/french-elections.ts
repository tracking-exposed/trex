import { join } from 'path';

import * as t from 'io-ts';

import { ExperimentDescriptor } from '@experiment';
import { decodeOrThrow } from '@util/fp';
import { sleep } from '@util/misc';
import { createHandleCaptcha, ensureLoggedIn } from '@TikTok/util/page';
import { parseSearchTop } from '@TikTok/parser/index';
import { loadQueriesCSV } from '@util/csv';
import { fillInput } from '@util/page';
import { loadProfileState } from '@project/state';

import {
  init,
  showBasicInfo,
  confirmPublicKeyNoted,
} from '@TikTok/util/project';

import { MinimalProjectConfig } from '@project/init';

const Config = t.intersection(
  [
    MinimalProjectConfig,
    t.type(
      {
        baseURL: t.string,
      },
      'baseURL',
    ),
  ],
  'Config',
);
type Config = t.TypeOf<typeof Config>;

const experimentType = 'tt-french-elections';

export const FrenchElections: ExperimentDescriptor = {
  experimentType,
  init: async({ projectDirectory }) => {
    await init({
      projectDirectory,
      experimentType,
    });
  },
  run: async({
    page,
    logger,
    projectDirectory,
    project: minimalConfig,
    saveSnapshot,
  }) => {
    const project = decodeOrThrow(Config)(minimalConfig);

    // TODO: how can this be made type safe?
    const queries = await loadQueriesCSV(join(projectDirectory, 'queries.csv'));

    const profileState = await loadProfileState(projectDirectory);
    const handleCaptcha = createHandleCaptcha(page, logger);

    showBasicInfo(logger, profileState);

    await page.goto(project.baseURL);

    await handleCaptcha();
    await ensureLoggedIn(page);

    await confirmPublicKeyNoted(page, profileState);

    for (const query of queries) {
      logger.log(`Searching for "${query}"...`);

      await fillInput(page, '[data-e2e="search-user-input"]', query);
      await page.keyboard.press('Enter');
      await handleCaptcha();
      await sleep(5000);

      await saveSnapshot(
        {
          baseURL: project.baseURL,
          query,
        },
        parseSearchTop,
      );
    }

    return page;
  },
};

export default FrenchElections;
