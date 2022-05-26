import {
  NotFoundError,
  toBackendError,
} from '@shared/backend/errors/BackendError';
import { Route } from '@shared/backend/types';
import { authenticationMiddleware } from '@shared/backend/utils/authenticationMiddleware';
import { AddEndpoint } from '@shared/backend/utils/endpoint';
import * as Endpoints from '@yttrex/shared/endpoints';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as ycai from '../../lib/ycai';

export const DeleteRecommendationRoute: Route = (r, { db, logger }) => {
  AddEndpoint(r, authenticationMiddleware(logger))(
    Endpoints.v3.Creator.DeleteRecommendation,
    ({ params: { urlId }, headers }) => {
      logger.debug('Authorized request %O', headers);
      logger.debug('Delete recommendation by url id %s', urlId);

      return pipe(
        // connect to db
        TE.tryCatch(
          () => ycai.getCreatorByToken(headers['x-authorization']),
          toBackendError
        ),
        TE.chain((user) =>
          pipe(
            TE.tryCatch(
              () =>
                db.readOne(
                  db.mongo,
                  'recommendations',
                  { urlId, channelId: user.channelId },
                  {}
                ),
              toBackendError
            ),
            TE.filterOrElse(
              (r) => r !== undefined,
              () => NotFoundError('recommendations')
            ),
            TE.chain(() =>
              TE.tryCatch(
                () =>
                  db.deleteMany(db.mongo, 'recommendations', {
                    urlId,
                    channelId: user.channelId,
                  }),
                toBackendError
              )
            )
          )
        ),
        TE.map((result) => ({
          body: result.acknowledged,
          statusCode: 200,
        }))
      );
    }
  );
};
