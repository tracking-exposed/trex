import { NotAuthorizedError } from '../../errors/APIError';
import * as express from 'express';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as logger from '../../logger';

const HeadersWithAuthorization = t.strict(
  {
    'x-authorization': t.string,
  },
  'HeadersWithAuthorization'
);

export const authenticationMiddleware: (
  logger: logger.Logger
) => express.RequestHandler = (l) => (req, _res, next) => {
  const decodedHeaders = HeadersWithAuthorization.decode(req.headers);

  l.debug('Decoded headers errors %O', PathReporter.report(decodedHeaders));

  return pipe(
    decodedHeaders,
    E.mapLeft(() => NotAuthorizedError()),
    E.fold(
      (e) => next(e),
      (d) => {
        l.debug('Calling next handler...');
        next();
      }
    )
  );
};
