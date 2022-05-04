import * as t from 'io-ts';

export const Experiment = t.strict({}, 'ExperimentDB');

export type Experiment = t.TypeOf<typeof Experiment>;
