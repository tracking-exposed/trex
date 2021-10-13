import { Endpoints } from '@backend/endpoints/v3';
import { available } from 'avenger';
import * as Query from 'avenger/lib/Query';
import axios, { AxiosResponse } from 'axios';
import { config } from 'config';
import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { MinimalEndpointInstance, TypeOfEndpointInstance } from 'ts-endpoint';
import { apiLogger } from 'utils/logger.utils';

const client = axios.create({
  baseURL: config.REACT_APP_API_URL + '/v3',
});

export class APIError extends Error {
  details: string[];
  constructor(message: string, details: string[]) {
    super(message);
    this.details = details;
  }
}

const toError = (e: unknown): APIError => {
  // eslint-disable-next-line
  apiLogger.error('An error occured %O', e);
  if (e instanceof Error) {
    return new APIError(e.message, []);
  }

  return new APIError('An error occured', []);
};

const liftFetch = <B>(
  lp: () => Promise<AxiosResponse<B>>,
  decode: <A>(a: A) => E.Either<t.Errors, B>
): TE.TaskEither<APIError, B> => {
  return pipe(
    TE.tryCatch(lp, toError),
    TE.map((d) => d.data),
    TE.chain((content) => {
      return pipe(
        decode(content),
        E.mapLeft((e): APIError => {
          return new APIError(
            'Validation failed.',
            PathReporter.report(E.left(e))
          );
        }),
        TE.fromEither
      );
    })
  );
};

const toQuery = <E extends MinimalEndpointInstance>(
  e: E
): Query.CachedQuery<
  TypeOfEndpointInstance<E>['Input'],
  APIError,
  TypeOfEndpointInstance<E>['Output']
> => {
  return Query.queryShallow<any, APIError, TypeOfEndpointInstance<E>['Output']>(
    (params: TypeOfEndpointInstance<E>['Input']) =>
      pipe(
        liftFetch<TypeOfEndpointInstance<E>['Output']>(
          () =>
            client.request<
              any,
              AxiosResponse<TypeOfEndpointInstance<E>['Output']>
            >({
              method: e.Method,
              url: e.getPath(params?.Params),
              params: params?.Params,
              data: params?.Body,
            }),
          e.Output.decode
        )
      ),
    available
  );
};

type Queries = {
  [K in keyof Endpoints]: Endpoints[K] extends {
    [key: string]: MinimalEndpointInstance;
  }
    ? {
        [KK in keyof Endpoints[K]]: Query.CachedQuery<
          TypeOfEndpointInstance<Endpoints[K][KK]>['Input'],
          APIError,
          TypeOfEndpointInstance<Endpoints[K][KK]>['Output']
        >;
      }
    : never;
};

const Queries: Queries = pipe(
  R.toArray<keyof Endpoints, { [key: string]: MinimalEndpointInstance }>(
    Endpoints
  ),
  A.reduce<
    [keyof Endpoints, { [key: string]: MinimalEndpointInstance }],
    Queries
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  >({} as Queries, (q, [k, e]) => ({
    ...q,
    [k]: pipe(
      e,
      R.map((ee) => toQuery(ee))
    ) as any,
  }))
);

export { Queries };
