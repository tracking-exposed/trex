import { AppError } from '@shared/errors/AppError';
import {
  ComparisonDirectiveRow,
  DirectiveType,
} from '@shared/models/Directive';
import * as TE from 'fp-ts/lib/TaskEither';
import { NonEmptyString } from 'io-ts-types';
import type * as puppeteer from 'puppeteer-core';

export type GuardoniCommandConfig =
  | {
      run: 'register';
      records: ComparisonDirectiveRow[];
      type: DirectiveType;
    }
  | {
      run: 'register-csv';
      file: string;
      type: DirectiveType;
    }
  | {
      run: 'experiment';
      experiment: string;
    }
  | {
      run: 'auto';
      value: '1' | '2';
    };

export interface GuardoniConfig {
  headless: boolean;
  verbose: boolean;
  profile?: string;
  evidenceTag?: string;
  advScreenshotDir?: string;
  proxy?: string;
  backend?: string;
  basePath?: string;
  extensionDir?: string;
  excludeURLTag?: string[];
  chromePath?: string;
  loadFor?: number;
}

export type GuardoniConfigRequired = Omit<
  GuardoniConfig,
  | 'basePath'
  | 'profile'
  | 'backend'
  | 'evidenceTag'
  | 'extensionDir'
  | 'loadFor'
  | 'chromePath'
> & {
  profile: string;
  backend: string;
  basePath: string;
  evidenceTag: string;
  extensionDir: string;
  loadFor: number;
  chromePath: string;
};

export interface ProgressDetails {
  message: string;
  details: string[];
}

export interface GuardoniErrorOutput {
  type: 'error';
  message: string;
  details: string[];
}

export interface GuardoniSuccessOutput {
  type: 'success';
  message: string;
  values: Record<string, any>;
}

export type GuardoniOutput = GuardoniErrorOutput | GuardoniSuccessOutput;

export type GuardoniCLI = (command: GuardoniCommandConfig) => {
  run: TE.TaskEither<AppError, GuardoniOutput>;
  runOrThrow: () => Promise<void>;
};

export interface Guardoni {
  config: GuardoniConfigRequired;
  cli: GuardoniCLI;
  // register an experiment from the given csv file
  registerExperimentFromCSV: (
    file: NonEmptyString,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  registerExperiment: (
    records: ComparisonDirectiveRow[],
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperiment: (
    experiment: NonEmptyString
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperimentForPage: (
    page: puppeteer.Page,
    experiment: NonEmptyString,
    onProgress?: (details: ProgressDetails) => void
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
}
