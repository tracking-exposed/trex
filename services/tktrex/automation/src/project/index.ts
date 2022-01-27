import { join } from 'path';

import * as t from 'io-ts';

import { Page } from 'puppeteer';

import { Logger } from '../util/logger';

export const MinimalProjectConfig = t.type({
  experimentType: t.string,
  useStealth: t.boolean,
  proxy: t.union([t.null, t.string]),
});
export type MinimalProjectConfig = t.TypeOf<typeof MinimalProjectConfig>;

export interface RunOptions {
  createPage: (profileDirectory: string) => Promise<Page>;
  logger: Logger;
  profileDirectory: string;
  projectDirectory: string;
  project: MinimalProjectConfig;
}

export const generateDirectoryStructure = (
  projectDirectory: string,
): Record<string, string> => ({
  profileDirectory: join(projectDirectory, 'profile'),
  projectDirectory,
  extensionDirectory: join(projectDirectory, 'profile/tx.extension'),
  databaseDirectory: join(projectDirectory, 'database'),
  metaDataDirectory: join(projectDirectory, 'metaData'),
});
