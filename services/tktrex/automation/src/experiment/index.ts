import { Page } from 'puppeteer';

import { Logger } from '@util/logger';
import { MinimalProjectConfig } from '@project/index';

export interface InitOptions {
  projectDirectory: string;
  logger: Logger;
}

export type RunOptions = InitOptions & {
  page: Page;
  project: MinimalProjectConfig;
  saveSnapshot: (
    metaData: unknown,
    parser: (html: string) => unknown[] | Promise<unknown[]>,
  ) => Promise<void>;
};

export interface ExperimentDescriptor {
  experimentType: string;
  init(options: InitOptions): Promise<void>;
  run(options: RunOptions): Promise<Page>;
}

export default ExperimentDescriptor;
