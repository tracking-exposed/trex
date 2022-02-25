import { IOError } from 'ts-io-error/lib';

export class BackendError extends IOError {
  public readonly name = 'BackendError';
}

export const NotAuthorizedError = (): BackendError => {
  return {
    name: 'BackendError',
    status: 401,
    message: 'Authorization header is missing',
    details: {
      kind: 'ClientError',
      status: '401',
    },
  };
};

export const NotFoundError = (resource: string): BackendError => {
  return {
    name: 'BackendError',
    status: 404,
    message: `Can't find the resource ${resource}`,
    details: {
      kind: 'ClientError',
      status: '404',
    },
  };
};

export const toBackendError = (e: unknown): BackendError => {
  // eslint-disable-next-line
  console.error(e);
  if (e instanceof Error) {
    return new BackendError(e.message, {
      kind: 'ServerError',
      status: e.name,
    });
  }

  return new BackendError('UnknownError', {
    kind: 'ServerError',
    status: 'Unknown',
  });
};
