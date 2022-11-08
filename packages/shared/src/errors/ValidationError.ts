import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { APIError, isAPIError } from './APIError';

export const toValidationError = (
  message: string,
  errors: t.ValidationError[]
): APIError => {
  const failures = failure(errors);
  // console.log(failure(errors));
  return {
    name: 'APIError',
    message,
    status: 400,
    details: {
      kind: 'DecodingError',
      errors: failures,
    },
  };
};

export const isValidationError = (
  e: unknown
): e is APIError & { type: 'ValidationError' } => {
  return isAPIError(e) && e.details.kind === 'DecodingError';
};
