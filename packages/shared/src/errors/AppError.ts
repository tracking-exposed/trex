import { IOError } from 'ts-io-error';
import { APIError } from './APIError';

export class AppError extends IOError {
  name = 'AppError';
}

export const toAppError = (e: unknown): AppError => {
  if (e instanceof APIError) {
    return {
      ...e,
      name: 'AppError',
      details: {
        kind: 'ClientError',
        meta: {},
        status: '',
      },
    };
  }

  if (e instanceof Error) {
    return {
      name: 'AppError',
      message: e.message,
      status: 500,
      details: { kind: 'ClientError', meta: [], status: 'client error' },
    };
  }

  return {
    name: 'AppError',
    message: (e as any).name ?? `Unknown Error`,
    status: 500,
    details: {
      kind: 'ClientError',
      meta: [],
      status: (e as any).message ?? 'Something bad happened',
    },
  };
};
