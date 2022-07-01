import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types';
import { Directive } from './Directive';

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    links: t.array(Directive),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;

export const GetDirectiveOutput = nonEmptyArray(
  GuardoniExperiment,
  'GetDirectiveOutput'
);
export type GetDirectiveOutput = t.TypeOf<typeof GetDirectiveOutput>;

export const ConcludeGuardoniExperimentOutput = t.type(
  {
    acknowledged: t.boolean,
  },
  'ConcludeGuardoniExperimentOutput'
);
export type ConcludeGuardoniExperimentOutput = t.TypeOf<
  typeof ConcludeGuardoniExperimentOutput
>;

export const GetExperimentListOutput = t.strict(
  {
    content: t.array(GuardoniExperiment),
    total: t.number,
    pagination: t.any,
  },
  'GetExperimentListOutput'
);

export const GetPublicDirectivesOutput = t.array(
  GuardoniExperiment,
  'GetPublicDirectivesOutput'
);
export type GetPublicDirectivesOutput = t.TypeOf<
  typeof GetPublicDirectivesOutput
>;
