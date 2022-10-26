import { Step } from '@shared/models/Step';
import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types/lib/nonEmptyArray';

export const Experiment = t.strict(
  {
    experimentId: t.string,
    status: t.string,
    publicKey: t.string,
    steps: nonEmptyArray(Step),
  },
  'ExperimentDB'
);

export type Experiment = t.TypeOf<typeof Experiment>;
