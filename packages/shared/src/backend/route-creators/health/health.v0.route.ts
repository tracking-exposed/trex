import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { toBackendError } from '../../errors/BackendError';
import * as Endpoints from '../../../endpoints';
import { RouteCreator } from '../../types';
import { AddEndpoint } from '../../utils/endpoint';

export const MakeHealthRoute: RouteCreator = (r, { db, logger }) => {
  AddEndpoint(r)(Endpoints.v0.Public.GetHealth, () => {
    logger.debug('Get Health');

    return pipe(
      // connect to db
      TE.tryCatch(() => db.clientConnect({ concurrency: 1 }), toBackendError),
      // count docs in a collection
      TE.chain((c) => TE.tryCatch(() => db.count(c, 'ytvids', {}), toBackendError)),
      // comment this out to see this fails
      // TE.chain((c) =>
      //   TE.tryCatch(
      //     () => db.aggregate(c, 'non-existing-collection', {}),
      //     toBackendError
      //   )
      // ),
      TE.map((result) => ({
        body: {
          data: 'OK',
          result
        },
        statusCode: 201,
      }))
    );
  });
};
