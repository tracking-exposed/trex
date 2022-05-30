import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';

// todo: this should be named CreateExperimentBody

export const PostDirectiveSuccessResponse = t.strict(
  {
    status: t.union([t.literal('exist'), t.literal('created')]),
    experimentId: t.string,
    since: t.union([DateFromISOString, t.undefined]),
  },
  'PostDirectiveSuccessResponse'
);

export type PostDirectiveSuccessResponse = t.TypeOf<
  typeof PostDirectiveResponse
>;

export const PostDirectiveResponse = t.union(
  [
    t.type({ error: t.type({ message: t.string }) }),
    PostDirectiveSuccessResponse,
  ],
  'PostDirectiveResponse'
);

export const CreateDirectiveBody = t.any;
export const DirectiveType = t.string;
