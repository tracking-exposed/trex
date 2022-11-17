import { command } from 'avenger';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as S from 'fp-ts/lib/string';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { MinimalEndpointInstance, TypeOfEndpointInstance } from '../endpoints';
import { APIError, fromAxiosError, isAPIError } from '../errors/APIError';
import { toValidationError } from '../errors/ValidationError';
import { trexLogger } from '../logger';
import qs from 'qs';

export const apiLogger = trexLogger.extend('API');

export const toAPIError = (e: unknown): APIError => {
  // eslint-disable-next-line
  apiLogger.error('An error occurred %O', e);
  if (isAPIError(e)) {
    return e;
  }

  if (axios.isAxiosError(e)) {
    return fromAxiosError(e);
  }

  if (e instanceof Error) {
    if (e.message === 'Network Error') {
      return new APIError('Network Error', {
        kind: 'NetworkError',
        status: '500',
        meta: [
          'The API endpoint is not reachable',
          "Be sure you're connected to internet.",
        ],
      });
    }
    return new APIError(e.message, {
      kind: 'ClientError',
      meta: e.stack,
      status: '500',
    });
  }

  return new APIError('An error occurred', {
    kind: 'ClientError',
    meta: JSON.stringify(e),
    status: '500',
  });
};

const liftFetch = <B>(
  lp: () => Promise<AxiosResponse<B>>,
  decode: <A>(a: A) => E.Either<t.Errors, B>
): TE.TaskEither<APIError, B> => {
  return pipe(
    TE.tryCatch(lp, toAPIError),
    TE.map((d) => d.data),
    TE.chain((content) => {
      return pipe(
        decode(content),
        E.mapLeft((e) => toValidationError('Validation failed', e)),
        E.mapLeft(toAPIError),
        TE.fromEither
      );
    })
  );
};

export interface HTTPClient {
  apiFromEndpoint: <E extends MinimalEndpointInstance>(e: E) => TERequest<E>;

  request: <T, R>(
    config: AxiosRequestConfig<T>,
    decode: (o: unknown) => E.Either<t.Errors, R>
  ) => TE.TaskEither<APIError, R>;
  get: <T>(
    url: string,
    config?: AxiosRequestConfig<any>
  ) => TE.TaskEither<APIError, T>;
  post: <T, R>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig<T>
  ) => TE.TaskEither<APIError, R>;
  put: <T, R>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig<T>
  ) => TE.TaskEither<APIError, R>;
}

export const MakeHTTPClient = (client: AxiosInstance): HTTPClient => {
  const request = <T, R>(
    config: AxiosRequestConfig<T>,
    decode: (o: unknown) => E.Either<t.Errors, R>
  ): TE.TaskEither<APIError, R> =>
    liftFetch(() => client.request(config), decode);

  const get = <T>(
    url: string,
    config?: AxiosRequestConfig<any>
  ): TE.TaskEither<APIError, T> =>
    liftFetch(() => client.get(url, config), t.any.decode);

  const post = <T, R>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig<T>
  ): TE.TaskEither<APIError, R> =>
    liftFetch(() => client.post(url, data, config), t.any.decode);

  const put = <T, R>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig<T>
  ): TE.TaskEither<APIError, R> =>
    liftFetch(() => client.put(url, data, config), t.any.decode);

  const apiFromEndpoint = <E extends MinimalEndpointInstance>(
    e: E
  ): TERequest<E> => {
    return command<any, APIError, TypeOfEndpointInstance<E>['Output']>((b) =>
      pipe(
        sequenceS(E.Applicative)({
          params: (e.Input?.Params ?? t.any).decode(b?.Params),
          query: (e.Input?.Query ?? t.any).decode(b?.Query),
          body: (e.Input?.Body ?? t.any).decode(b?.Body),
          headers: (e.Input?.Headers ?? t.any).decode(b?.Headers),
          method: E.right<any, E['Method']>(e.Method),
        }),
        TE.fromEither,
        TE.mapLeft((e): APIError => {
          const details = PathReporter.report(E.left(e));
          apiLogger.error('MakeHTTPClient Validation failed %O', details);
          return pipe(toValidationError('Validation failed', e), toAPIError);
        }),
        TE.chain((input) => {
          const url = e.getPath(input.params);
          apiLogger.debug('%s %s %O', e.Method, url, input);
          return pipe(
            liftFetch<TypeOfEndpointInstance<E>['Output']>(() => {
              return client.request<
                TypeOfEndpointInstance<E>['Input'],
                AxiosResponse<TypeOfEndpointInstance<E>['Output']>
              >({
                method: e.Method,
                url,
                params: input.query,
                paramsSerializer(params) {
                  const q = qs.stringify(params);
                  return q;
                },
                data: input.body,
                responseType: 'json',
                headers: {
                  Accept: 'application/json',
                  ...input.headers,
                },
              });
            }, e.Output.decode),
            TE.map((output) => {
              // apiLogger.debug('%s %s output: %O', e.Method, url, output);
              return output;
            })
          );
        })
      )
    );
  };

  return { apiFromEndpoint, request, get, post, put };
};

export type TERequest<E extends MinimalEndpointInstance> =
  TypeOfEndpointInstance<E>['Input'] extends never
    ? (
        input?: TypeOfEndpointInstance<E>['Input'],
        ia?: any
      ) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>['Output']>
    : (
        input: TypeOfEndpointInstance<E>['Input'],
        ia?: any
      ) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>['Output']>;

export interface ResourceEndpointsRecord {
  [apiKey: string]: MinimalEndpointInstance;
}
export interface EndpointsConfig {
  [typeKey: string]: ResourceEndpointsRecord;
}

type API<ES extends EndpointsConfig> = {
  [K in keyof ES]: ES[K] extends {
    [key: string]: MinimalEndpointInstance;
  }
    ? {
        [KK in keyof ES[K]]: TERequest<ES[K][KK]>;
      }
    : never;
} & { request: HTTPClient['request'] };

const makeAPI =
  (client: HTTPClient) =>
  <ES extends { [key: string]: ResourceEndpointsRecord }>(es: ES): API<ES> => {
    const APIInit: API<ES> = {} as any;

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
          R.map((ee) => client.apiFromEndpoint(ee))
        ) as any,
      }))
    );
  };

export interface GetAPIOptions {
  baseURL: string;
  getAuth: (req: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
  onUnauthorized: (res: AxiosResponse) => Promise<AxiosResponse>;
}

export type APIClient<EV extends { [v: string]: EndpointsConfig }> = {
  [K in keyof EV]: API<EV[K]>;
};

export const MakeAPIClient = <EE extends { [v: string]: EndpointsConfig }>(
  opts: GetAPIOptions,
  endpoints: EE
): { API: APIClient<EE>; HTTPClient: HTTPClient } => {
  apiLogger.debug('Initialize api client with options %O', opts);
  const axiosClient = axios.create({
    baseURL: opts.baseURL,
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

  axiosClient.interceptors.request.use(opts.getAuth);

  axiosClient.interceptors.response.use(
    (res) => {
      // nothing to do here
      return res;
    },
    async (err) => {
      const axiosError = err as AxiosError;
      // use provided handler if error is unauthorized
      if (axiosError.response?.status === 401) {
        await opts.onUnauthorized(axiosError.response);
      }

      throw err;
    }
  );

  const HTTPClient = MakeHTTPClient(axiosClient);

  const toAPI = makeAPI(HTTPClient);

  const API = pipe(
    endpoints,
    R.reduceWithIndex(S.Ord)({} as any as APIClient<EE>, (key, acc, ee) => ({
      ...acc,
      [key]: toAPI(ee),
    }))
  );

  return { API, HTTPClient };
};
