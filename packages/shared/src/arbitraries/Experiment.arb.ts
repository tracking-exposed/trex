import fc from 'fast-check';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { CreateExperimentSuccessResponse, GuardoniExperiment } from '../models/Experiment';
import { propsOmit } from '../utils/arbitrary.utils';


const { status, since, ...CreateExperimentResponseProps } =
  CreateExperimentSuccessResponse.type.props;
export const PostDirectiveSuccessResponseArb = getArbitrary(
  t.strict({ ...CreateExperimentResponseProps })
).map((r) => ({
  ...r,
  status: fc.sample(
    fc.oneof(fc.constant('created'), fc.constant('exist')),
    1
  )[0],
  experimentId: fc.sample(fc.uuid(), 1)[0],
  since: new Date().toISOString(),
}));

export const GuardoniExperimentArb = getArbitrary(
  t.strict(propsOmit(GuardoniExperiment, ['when', 'steps']))
).map((exp) => ({
  ...exp,
  experimentId: fc.sample(fc.uuid(), 1)[0],
  when: new Date().toISOString(),
  steps: [],
}));
