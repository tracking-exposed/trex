import * as Endpoints from '@shared/endpoints';
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
  name: string;
  details: string[];
  constructor(name: string, message: string, details: string[]) {
    super(message);
    this.name = name;
    this.details = details;
  }
}

export const toAPIError = (e: unknown): APIError => {
  // eslint-disable-next-line
  apiLogger.error('An error occurred %O', e);
  if (e instanceof Error) {
    if (e.message === 'Network Error') {
      return new APIError(
        'Network Error',
        'The API endpoint is not reachable',
        ["Be sure you're connected to internet."]
      );
    }
    return new APIError('UnknownError', e.message, []);
  }

  return new APIError('UnknownError', 'An error occurred', [JSON.stringify(e)]);
};

export const endpointClient = axios.create({
  baseURL: config.API_URL,
  // transformRequest: (req) => {
  //   // req.headers('X-YTtrex-Version', config.VERSION);
  //   // req.headers('X-YTtrex-Build', config.BUILD);
  //   // const signature = nacl.sign.detached(
  //   //   decodeString(payload),
  //   //   decodeKey(keypair.secretKey)
  //   // );
  //   // xhr.setRequestHeader('X-YTtrex-NonAuthCookieId', cookieId);
  //   // xhr.setRequestHeader('X-YTtrex-PublicKey', keypair.publicKey);
  //   // xhr.setRequestHeader('X-YTtrex-Signature', bs58.encode(signature));
  //   return req;
  // },
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
          const details = PathReporter.report(E.left(e));
          apiLogger.error('Validation failed %O', details);
          return new APIError('ValidationError', 'Validation failed.', details);
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

export type TERequest<E extends MinimalEndpointInstance> = (
  input: TypeOfEndpointInstance<E>['Input']
) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>['Output']>;

type API<ES extends Record<string, Record<string, MinimalEndpointInstance>>> = {
  [K in keyof ES]: ES[K] extends {
    [key: string]: MinimalEndpointInstance;
  }
    ? {
        [KK in keyof ES[K]]: TERequest<ES[K][KK]>;
      }
    : never;
} & {
  request: <T, R>(
    config: AxiosRequestConfig<T>,
    decode: (o: unknown) => E.Either<t.Errors, R>
  ) => TE.TaskEither<APIError, R>;
};

export const apiFromEndpoint = <E extends MinimalEndpointInstance>(
  e: E
): TERequest<E> => {
  return command<any, APIError, TypeOfEndpointInstance<E>['Output']>((b) =>
    liftFetch<TypeOfEndpointInstance<E>['Output']>(() => {
      const url = e.getPath(b.Params);
      apiLogger.debug('%s %s %O', e.Method, url, b);

      return endpointClient.request<
        TypeOfEndpointInstance<E>['Input'],
        AxiosResponse<TypeOfEndpointInstance<E>['Output']>
      >({
        method: e.Method,
        url,
        data: b.Body,
        responseType: 'json',
        headers: {
          Accept: 'application/json',
          ...b.Headers,
        },
      });
    }, e.Output.decode)
  );
};

const toAPI = <
  ES extends { [key: string]: Record<string, MinimalEndpointInstance> }
>(
  es: ES
): API<ES> => {
  const APIInit: API<ES> = {
    request: <T, R>(
      config: AxiosRequestConfig<T>,
      decode: (o: unknown) => E.Either<t.Errors, R>
    ) => liftFetch(() => endpointClient.request(config), decode),
  } as any;

  return pipe(
    R.toArray<string, { [key: string]: MinimalEndpointInstance }>(es),
    A.reduce<
      [keyof ES, { [key: string]: MinimalEndpointInstance }],
      API<ES>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    >(APIInit, (q, [k, e]) => ({
      ...q,
      [k]: pipe(
        e,
        R.map((ee) => apiFromEndpoint(ee))
      ) as any,
    }))
  );
};

const v1 = toAPI(Endpoints.v1);
const v2 = toAPI(Endpoints.v2);
const v3 = toAPI(Endpoints.v3);

const API = {
  v1,
  v2,
  v3,
};

export { API };
