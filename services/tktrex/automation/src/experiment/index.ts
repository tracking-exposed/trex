import { Page } from 'puppeteer';

import { Logger } from '@util/logger';
import { MinimalProjectConfig } from '@project/init';
import { BaseModel, StorableObject } from '@storage/db';

export interface InitOptions {
  projectDirectory: string;
  logger: Logger;
}

export type RunOptions = InitOptions & {
  createPage: ({
    requiresExtension,
    proxy,
  }: {
    requiresExtension: boolean;
    proxy?: string;
  }) => Promise<Page>;
  project: MinimalProjectConfig;
  saveSnapshot: (
    metaData: StorableObject,
    parser: (html: string) => BaseModel[] | Promise<BaseModel[]>
  ) => Promise<void>;
};

export interface ExperimentDescriptor {
  experimentType: string;
  init(options: InitOptions): Promise<void>;
  run(options: RunOptions): Promise<Page>;
}

export default ExperimentDescriptor;
