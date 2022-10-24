import * as t from 'io-ts';
import { nonEmptyArray } from 'io-ts-types/lib/nonEmptyArray';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { Step } from './Step';

export const GuardoniExperiment = t.strict(
  {
    experimentId: t.string,
    when: t.string,
    steps: t.array(Step),
    publicKey: t.union([t.string, t.undefined]),
    status: t.union([t.literal('exist'), t.literal('active'), t.undefined]),
  },
  'GuardoniExperiment'
);
export type GuardoniExperiment = t.TypeOf<typeof GuardoniExperiment>;

export const GetDirectiveOutput = nonEmptyArray(
  GuardoniExperiment,
  'GetDirectiveOutput'
);
export type GetDirectiveOutput = t.TypeOf<typeof GetDirectiveOutput>;

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

export const CreateExperimentSuccessResponse = t.strict(
  {
    status: t.union([t.literal('exist'), t.literal('created')]),
    experimentId: t.string,
    since: DateFromISOString,
    steps: t.array(Step),
  },
  'CreateExperimentSuccessResponse'
);

export type CreateExperimentSuccessResponse = t.TypeOf<
  typeof CreateExperimentSuccessResponse
>;

export const CreateExperimentResponse = t.union(
  [
    t.type({ error: t.type({ message: t.string }) }),
    CreateExperimentSuccessResponse,
  ],
  'CreateExperimentResponse'
);
export type CreateExperimentResponse = t.TypeOf<
  typeof CreateExperimentResponse
>;
