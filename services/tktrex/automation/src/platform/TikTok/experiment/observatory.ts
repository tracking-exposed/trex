import * as t from 'io-ts';

import { Page } from 'puppeteer';
import { join } from 'path';
import { writeFile } from 'fs/promises';

import { ExperimentDescriptor } from '@experiment';
import { decodeOrThrow } from '@util/fp';
import { countriesAsCSV } from '@util/l10n';

import { MinimalProjectConfig } from '@project/init';
import { getAssetPath } from '../util/project';
import { flatCopyFiles } from '../../../util/fs';
import { loadCountriesCSV } from '@util/csv';

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

const experimentType = 'tt-observatory';

export const FrenchElections: ExperimentDescriptor = {
  experimentType,

  init: async({ projectDirectory }) => {
    const fromDir = getAssetPath(experimentType);
    const toDir = projectDirectory;
    await flatCopyFiles(fromDir, toDir);
    await writeFile(join(toDir, 'countries.csv'), countriesAsCSV);
  },

  run: async({
    createPage,
    logger,
    projectDirectory,
    project: minimalConfig,
    saveSnapshot,
  }): Promise<Page> => {
    const countries = await loadCountriesCSV(
      join(projectDirectory, 'countries.csv'),
    );

    const project = decodeOrThrow(Config)(minimalConfig);

    let page: Page | undefined;

    for (const { countryCode } of countries) {
      if (page) {
        await page.close();
      }

      const proxyUser = project.proxyUser?.replace(
        '[2_CHAR_COUNTRY_CODE]',
        countryCode.toLowerCase(),
      );

      page = await createPage({
        requiresExtension: false,
        proxyOverride: `${proxyUser}@${project.proxy}`,
      });

      await page.goto(project.baseURL);
    }

    if (!page) {
      throw new Error('no page');
    }

    return page;
  },
};

export default FrenchElections;
