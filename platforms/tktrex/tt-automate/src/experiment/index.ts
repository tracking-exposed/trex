import { Page } from 'puppeteer-core';
import { Logger } from '@util/logger';
import { BaseModel, StorableObject } from '@storage/db';
import { MinimalProjectConfig } from '../config';

export interface InitOptions {
  projectDirectory: string;
  logger: Logger;
}

export type RunOptions = InitOptions & {
  page: Page;
  project: MinimalProjectConfig;
  saveSnapshot: (
    metaData: StorableObject,
    parser: (html: string) => BaseModel[] | Promise<BaseModel[]>
  ) => Promise<void>;
};

export interface ExperimentDescriptor {
  experimentType: string;
  init: (options: InitOptions) => Promise<void>;
  run: (options: RunOptions) => Promise<Page>;
}

export default ExperimentDescriptor;
