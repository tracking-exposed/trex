import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { config } from '../../../config';
import { pipe } from 'fp-ts/lib/function';

const getURL = (path: string): string => `${config.REACT_APP_API_URL}${path}`;

const client = window.fetch;

export const fetchTE = <T = any>(
  path: string,
  params?: any
): TE.TaskEither<Error, T> => {
  const url = getURL(path);

  // eslint-disable-next-line no-console
  console.log(`Fetching ${url}`, { params });

  return pipe(
    TE.tryCatch(
      () =>
        client(url, params).then((resp) => {

          if (resp.status === 400) {
            return Promise.reject(new Error('Bad Request'));
          }

          if (resp.status === 401) {
            return Promise.reject(new Error('Bad Request'));
          }

          if (resp.status === 404) {
            return Promise.reject(new Error('Not found'));
          }

          if (resp.status === 500) {
            return Promise.reject(new Error('Server error'));
          }

          return resp.json();
        }),
      E.toError
    )
  );
};
