import { Endpoints } from '@backend/endpoints/v3';
import { command } from 'avenger';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { MinimalEndpointInstance, TypeOfEndpointInstance } from 'ts-endpoint';
import { config } from '../config';
import { apiLogger } from '../utils/logger.utils';

export class APIError extends Error {
  details: string[];
  constructor(message: string, details: string[]) {
    super(message);
    this.details = details;
  }
}

export const toAPIError = (e: unknown): APIError => {
  // eslint-disable-next-line
  apiLogger.error('An error occured %O', e);
  if (e instanceof Error) {
    return new APIError(e.message, []);
  }

  return new APIError('An error occured', []);
};

export const endpointClient = axios.create({
  baseURL: config.REACT_APP_API_URL,
  transformRequest: (req) => {
    // req.headers('X-YTtrex-Version', config.VERSION);
    // req.headers('X-YTtrex-Build', config.BUILD);
    // const signature = nacl.sign.detached(
    //   decodeString(payload),
    //   decodeKey(keypair.secretKey)
    // );
    // xhr.setRequestHeader('X-YTtrex-NonAuthCookieId', cookieId);
    // xhr.setRequestHeader('X-YTtrex-PublicKey', keypair.publicKey);
    // xhr.setRequestHeader('X-YTtrex-Signature', bs58.encode(signature));
  },
});

export const liftFetch = <B>(
  lp: () => Promise<AxiosResponse<B>>,
  decode: <A>(a: A) => E.Either<t.Errors, B>
): TE.TaskEither<APIError, B> => {
  return pipe(
    TE.tryCatch(lp, toAPIError),
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

export const get = <T>(
  url: string,
  config?: AxiosRequestConfig<any>
): TE.TaskEither<Error, T> =>
  liftFetch(() => endpointClient.get(url, config), t.any.decode);

export const post = <T, R>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig<T>
): TE.TaskEither<Error, R> =>
  liftFetch(() => endpointClient.post(url, data, config), t.any.decode);

export const put = <T, R>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig<T>
): TE.TaskEither<Error, R> =>
  liftFetch(() => endpointClient.put(url, data, config), t.any.decode);

type TERequest<E extends MinimalEndpointInstance> = (
  input: TypeOfEndpointInstance<E>['Input']
) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>['Output']>;

type API = {
  [K in keyof Endpoints]: Endpoints[K] extends {
    [key: string]: MinimalEndpointInstance;
  }
    ? {
        [KK in keyof Endpoints[K]]: TERequest<Endpoints[K][KK]>;
      }
    : never;
} & {
  request: <T, R>(
    config: AxiosRequestConfig<T>,
    decode: (o: unknown) => E.Either<t.Errors, R>
  ) => TE.TaskEither<APIError, R>;
};

const toTERequest = <E extends MinimalEndpointInstance>(e: E): TERequest<E> => {
  return command<any, APIError, TypeOfEndpointInstance<E>['Output']>((b) =>
    liftFetch<TypeOfEndpointInstance<E>['Output']>(
      () =>
        endpointClient.request<
          TypeOfEndpointInstance<E>['Input'],
          AxiosResponse<TypeOfEndpointInstance<E>['Output']>
        >({
          method: e.Method,
          url: e.getPath(e.Input?.Params),
          data: b,
        }),
      e.Output.decode
    )
  );
};

const APIInit: API = {
  request: <T, R>(
    config: AxiosRequestConfig<T>,
    decode: (o: unknown) => E.Either<t.Errors, R>
  ) => liftFetch(() => endpointClient.request(config), decode),
} as any;

const API: API = pipe(
  R.toArray<keyof Endpoints, { [key: string]: MinimalEndpointInstance }>(
    Endpoints
  ),
  A.reduce<
    [keyof Endpoints, { [key: string]: MinimalEndpointInstance }],
    API
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  >(APIInit, (q, [k, e]) => ({
    ...q,
    [k]: pipe(
      e,
      R.map((ee) => toTERequest(ee))
    ) as any,
  }))
);

export { API };
