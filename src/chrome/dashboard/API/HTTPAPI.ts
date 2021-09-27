import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { config } from '../../../config';

const getURL = (path: string): string => `${config.REACT_APP_API_URL}${path}`;

const client = window.fetch;

export const fetchTE = (
  path: string,
  params?: any
): TE.TaskEither<Error, any> => {
  const url = getURL(path);

  // eslint-disable-next-line no-console
  console.log(`Fetching ${url}`, { params });

  return TE.tryCatch(
    () => client(url, params).then((resp) => resp.json()),
    E.toError
  );
};
