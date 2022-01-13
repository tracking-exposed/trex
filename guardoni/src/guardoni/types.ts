import { AppError } from '@shared/errors/AppError';
import { DirectiveType } from '@shared/models/Directive';
import * as TE from 'fp-ts/lib/TaskEither';
import * as puppeteer from 'puppeteer-core';

export type GuardoniCommandConfig =
  | {
      run: 'register';
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
  profile?: string;
  evidenceTag?: string;
  headless: boolean;
  verbose: boolean;
  advdump?: string;
  proxy?: string;
  backend?: string;
  basePath?: string;
  extensionDir?: string;
  excludeURLTag?: string[]
  chromePath?: string;
  loadFor?: number;
}

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
  cli: GuardoniCLI;
  // register an experiment from the given csv file
  registerExperiment: (
    file: string,
    directiveType: DirectiveType
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperiment: (
    experiment: string
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
  runExperimentForPage: (
    page: puppeteer.Page,
    experiment: string,
    onProgress?: (details: ProgressDetails) => void
  ) => TE.TaskEither<AppError, GuardoniSuccessOutput>;
}
