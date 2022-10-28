import axios, { AxiosError } from 'axios';
import { IOError } from 'ts-io-error/lib';

export const isAPIError = (e: unknown): e is APIError => {
  return (e as any).name === 'APIError';
};

export class APIError extends IOError {
  public readonly name = 'APIError';
}

export const NotAuthorizedError = (): APIError => {
  return {
    name: 'APIError',
    status: 401,
    message: 'Authorization header is missing',
    details: {
      kind: 'ClientError',
      status: '401',
    },
  };
};

export const NotFoundError = (resource: string): APIError => {
  return {
    name: 'APIError',
    status: 404,
    message: `Can't find the resource ${resource}`,
    details: {
      kind: 'ClientError',
      status: '404',
    },
  };
};

export const fromAxiosError = (e: AxiosError): APIError => {
  return (
    e.response?.data ?? {
      name: 'APIError',
      status: e.response?.status ?? 500,
      message: e.message ?? e.response?.data?.error?.message,
      details: {
        kind: 'ServerError',
        status: '500',
        meta: e.response?.data,
      },
    }
  );
};

export const toAPIError = (e: unknown): APIError => {
  // eslint-disable-next-line
  console.error(e);
  if (isAPIError(e)) {
    return e;
  }

  if (axios.isAxiosError(e)) {
    return fromAxiosError(e);
  }

  if (e instanceof Error) {
    return new APIError(e.message, {
      kind: 'ServerError',
      status: e.name,
      meta: (e as any).details,
    });
  }

  return new APIError('UnknownError', {
    kind: 'ServerError',
    status: 'Unknown',
    meta: e,
  });
};
