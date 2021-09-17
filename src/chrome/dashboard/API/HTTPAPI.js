import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import config from '../../../config';

const getURL = (path) => `${config.API_ROOT}${path}`;

const client = window.fetch;

export const fetchTE = (path, params) => {
  // eslint-disable-next-line no-console
  console.log(`Fetching ${path}`, { params });
  return TE.tryCatch(
    () => client(getURL(path), params).then((resp) => resp.json()),
    E.toError
  );
};
