import * as TE from 'fp-ts/lib/TaskEither';
import { AppError } from '@shared/errors/AppError';

export interface Guardoni {
  runExperiment: () => TE.TaskEither<AppError, void>;
  runFromCSV: () => TE.TaskEither<AppError, void>;
}

type GuardoniCommandConfig =
  | {
      run: 'csv';
      file: string;
      type: 'comparison' | 'shadowban';
    }
  | {
      run: 'auto';
      value: '1' | '2';
    }
  | {
      run: 'experiment';
      experiment: string;
    };

export type GuardoniConfig = GuardoniCommandConfig & {
  profile?: string;
  evidenceTag?: string;
  headless: boolean;
  verbose: boolean;
  advdump?: string;
  proxy?: string
};

export type GetGuardoni = (config: GuardoniConfig) => Guardoni;
