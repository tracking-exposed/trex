import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { APIError, isAPIError } from './APIError';
import { AppError } from './AppError';

export const toValidationError = (
  message: string,
  errors: t.ValidationError[]
): AppError => {
  return {
    name: 'APIError',
    message,
    status: 400,
    details: {
      kind: 'DecodingError',
      errors: failure(errors),
    },
  };
};

export const isValidationError = (
  e: unknown
): e is APIError & { type: 'ValidationError' } => {
  return isAPIError(e) && e.type === 'ValidationError';
};
