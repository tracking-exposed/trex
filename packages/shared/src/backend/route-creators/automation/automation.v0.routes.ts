import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { toBackendError } from '@shared/backend/errors/BackendError';
import { RouteCreator } from '@shared/backend/types';
import { AddEndpoint } from '@shared/backend/utils/endpoint';

import AutomationEndpoints from '@shared/endpoints/automation';

const register: RouteCreator = (router, ctx) => {
  AddEndpoint(router)(AutomationEndpoints.v0.CreateScenario, (req) =>
    pipe(
      TE.tryCatch(() => {
        const doc = req.body;

        return ctx.db.client
          .db('automation')
          .collection('scenari')
          .insertOne(doc);
      }, toBackendError),
      TE.map(() => ({
        statusCode: 201,
        body: {}
      })),
    )
  );
};

export const routeCreators: RouteCreator[] = [register];

export default routeCreators;
