import { IOError } from 'ts-io-error';
import { isAPIError } from './APIError';

export class AppError extends IOError {
  name = 'AppError';
}

export const toAppError = (e: unknown): AppError => {
  if (isAPIError(e)) {
    return {
      ...e,
      name: 'AppError',
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

export const appErrorDetailsToString = (e: AppError): string[] => {
  if (e.details.kind === 'DecodingError') {
    return e.details.errors as string[];
  }

  return [e.details.kind, e.details.status, JSON.stringify(e.details.meta)];
};
