import * as TE from 'fp-ts/lib/TaskEither';
import { config } from '../config';
import { pipe } from 'fp-ts/lib/function';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// const getURL = (path: string): string => `${config.REACT_APP_API_URL}${path}`;

const client = axios.create({
  baseURL: config.REACT_APP_API_URL,
});

const toError = (e: unknown): Error => {
  if (e instanceof Error) {
    return e;
  }

  return new Error('An error occured');
};


const liftClientRequest = <T>(
  promiseL: () => Promise<AxiosResponse<T>>
): TE.TaskEither<Error, T> => {
  return pipe(
    TE.tryCatch(promiseL, toError),
    TE.map((r) => r.data)
  );
};

export const get = <T>(
  url: string,
  config?: AxiosRequestConfig<any>
): TE.TaskEither<Error, T> => liftClientRequest(() => client.get(url, config));

export const post = <T, R>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig<T>
): TE.TaskEither<Error, R> => liftClientRequest(() => client.post(url,data, config));

export const put = <T, R>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig<T>
): TE.TaskEither<Error, R> => liftClientRequest(() => client.put(url,data, config));