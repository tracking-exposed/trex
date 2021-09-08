import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

const config = {
  API_ROOT: 'http://localhost:9000/api/v3'
};

const getURL = (path) => `${config.API_ROOT}${path}`;

const client = window.fetch;

export const fetch = (path, params) => {
  console.log(`Fetching ${path}`, { params });
  return TE.tryCatch(
    () => client(getURL(path), params).then((resp) => resp.json()),
    E.toError
  );
};
