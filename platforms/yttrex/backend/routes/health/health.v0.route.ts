import { toBackendError } from '@shared/backend/errors/BackendError';
import { Route } from '@shared/backend/types';
import { AddEndpoint } from '@shared/backend/utils/endpoint';
import * as Endpoints from '@yttrex/shared/endpoints';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

export const MakeHealthRoute: Route = (r, { db, logger }) => {
  AddEndpoint(r)(Endpoints.v0.Public.GetHealth, () => {
    logger.debug('Get Health');

    return pipe(
      // connect to db
      TE.tryCatch(() => db.clientConnect(), toBackendError),
      // count docs in a collection
      TE.chain((c) =>
        TE.tryCatch(() => db.count(c, 'ytvids', {}), toBackendError)
      ),
      // comment this out to see this fails
      // TE.chain((c) =>
      //   TE.tryCatch(
      //     () => db.aggregate(c, 'non-existing-collection', {}),
      //     toBackendError
      //   )
      // ),
      TE.map((result) => ({
        body: {
          data: 'OK' as const,
          result,
        },
        statusCode: 201,
      }))
    );
  });
};
