import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types';
import { Directive, DirectiveType } from './Directive';

export const ExperimentLink = t.strict(
  {
    title: t.union([t.string, t.undefined]),
    urltag: t.string,
    watchFor: t.union([t.string, t.number, t.null]),
    url: t.string,
  },
  'ExperimentLink'
);
export type ExperimentLink = t.TypeOf<typeof ExperimentLink>;

export const GetDirectiveOutput = nonEmptyArray(
  Directive,
  'GetDirectiveOutput'
);
export type GetDirectiveOutput = t.TypeOf<typeof GetDirectiveOutput>;

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    directiveType: DirectiveType,
    links: t.array(ExperimentLink),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;

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
