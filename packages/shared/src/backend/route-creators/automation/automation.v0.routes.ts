import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { toBackendError } from '../../errors/BackendError';
import { RouteCreator } from '../../types';
import { AddEndpoint } from '../../utils/endpoint';

import Endpoints from '../../../endpoints/automation/v0';

const register: RouteCreator = (router, ctx) => {
  AddEndpoint(router)(Endpoints.CreateScenario, (req) =>
    pipe(
      TE.tryCatch(() => {
        const doc = req.body;

        return ctx.db.client
          .db('automation')
          .collection('scripts')
          .insertOne(doc);
      }, toBackendError),
      TE.map((x) => ({
        body: {
          ok: true,
        },
        statusCode: 201,
      }))
    )
  );
};

export const routeCreators: RouteCreator[] = [register];

export default routeCreators;
