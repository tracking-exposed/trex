import { IOError } from 'ts-io-error/lib';

export class BackendError extends IOError {
  public readonly name = 'BackendError';
}

export const toBackendError = (e: unknown): BackendError => {
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
