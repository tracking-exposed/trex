import * as Endpoints from "../endpoints";
import { GetLogger } from "../logger";
import { command } from "avenger";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
import { MinimalEndpointInstance, TypeOfEndpointInstance } from "ts-endpoint";
import { APIError } from "../errors/APIError";

export const apiLogger = GetLogger("API");

export const toAPIError = (e: unknown): APIError => {
  // eslint-disable-next-line
  apiLogger.error("An error occurred %O", e);
  if (e instanceof Error) {
    if (e.message === "Network Error") {
      return new APIError(
        "Network Error",
        "The API endpoint is not reachable",
        ["Be sure you're connected to internet."]
      );
    }
    return new APIError("UnknownError", e.message, []);
  }

  return new APIError("UnknownError", "An error occurred", [JSON.stringify(e)]);
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
        E.mapLeft((e): APIError => {
          const details = PathReporter.report(E.left(e));
          apiLogger.error("Validation failed %O", details);
          return new APIError("ValidationError", "Validation failed.", details);
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
    return command<any, APIError, TypeOfEndpointInstance<E>["Output"]>((b) =>
      liftFetch<TypeOfEndpointInstance<E>["Output"]>(() => {
        const url = e.getPath(b.Params);
        apiLogger.debug("%s %s %O", e.Method, url, b);

        return client.request<
          TypeOfEndpointInstance<E>["Input"],
          AxiosResponse<TypeOfEndpointInstance<E>["Output"]>
        >({
          method: e.Method,
          url,
          params: b.Query,
          data: b.Body,
          responseType: "json",
          headers: {
            Accept: "application/json",
            ...b.Headers,
          },
        });
      }, e.Output.decode)
    );
  };

  return { apiFromEndpoint, request, get, post, put };
};

export type TERequest<E extends MinimalEndpointInstance> = (
  input: TypeOfEndpointInstance<E>["Input"],
  ia?: any
) => TE.TaskEither<APIError, TypeOfEndpointInstance<E>["Output"]>;

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
} & { request: HTTPClient["request"] };

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
}

export const GetAPI = (
  opts: GetAPIOptions
): {
  API: {
    v1: API<typeof Endpoints.v1>;
    v2: API<typeof Endpoints.v2>;
    v3: API<typeof Endpoints.v3>;
  };
  HTTPClient: HTTPClient;
} => {
  const HTTPClient = MakeHTTPClient(
    axios.create({
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
    })
  );

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
