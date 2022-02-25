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
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { MinimalEndpointInstance, TypeOfEndpointInstance } from 'ts-endpoint';
import * as Endpoints from '../endpoints';
import { APIError } from '../errors/APIError';
import { trexLogger } from '../logger';

export const apiLogger = trexLogger.extend('API');

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

const liftFetch = <B>(
  lp: () => Promise<AxiosResponse<B>>,
  decode: <A>(a: A) => E.Either<t.Errors, B>
): TE.TaskEither<APIError, B> => {
  return pipe(
    TE.tryCatch(lp, toAPIError),
    TE.map((d) => d.data),
    TE.chain((content) => {
      apiLogger.debug('Content received %O', content);
      return pipe(
        decode(content),
        E.mapLeft((e): APIError => {
          const details = PathReporter.report(E.left(e));
          apiLogger.error('Validation failed %O', details);
          return new APIError('ValidationError', 'Validation failed', details);
        }),
        TE.fromEither
      );
    })
  );
};

interface HTTPClient {
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
          apiLogger.error('Validation failed %O', details);
          return new APIError('ValidationError', 'Validation failed', details);
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
                data: input.body,
                responseType: 'json',
                headers: {
                  Accept: 'application/json',
                  ...input.headers,
                },
              });
            }, e.Output.decode),
            TE.map((output) => {
              apiLogger.debug('%s %s output: %O', e.Method, url, output);
              return output;
            })
          );
        })
      )
    );
  };

  return { apiFromEndpoint, request, get, post, put };
};

export type TERequest<E extends MinimalEndpointInstance> = (
  input: TypeOfEndpointInstance<E>['Input'],
  ia?: any
) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>['Output']>;

type API<
  ES extends {
    [typeKey: string]: { [apiKey: string]: MinimalEndpointInstance };
  }
> = {
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
  <ES extends { [key: string]: Record<string, MinimalEndpointInstance> }>(
    es: ES
  ): API<ES> => {
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

interface GetAPIOptions {
  baseURL: string;
  getAuth: (req: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
  onUnauthorized: (res: AxiosResponse) => Promise<AxiosResponse>;
}

export interface APIClient {
  v1: API<typeof Endpoints.v1>;
  v2: API<typeof Endpoints.v2>;
  v3: API<typeof Endpoints.v3>;
}

export const GetAPI = (
  opts: GetAPIOptions
): {
  API: APIClient;
  HTTPClient: HTTPClient;
} => {
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

  const v1 = toAPI(Endpoints.v1);
  const v2 = toAPI(Endpoints.v2);
  const v3 = toAPI(Endpoints.v3);

  const API = {
    v1,
    v2,
    v3,
  };

  return { API, HTTPClient };
};
