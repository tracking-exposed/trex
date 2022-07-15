import { APIError, isAPIError } from './APIError';

export const toValidationError = (
  message: string,
  details: string[]
): APIError => {
  return new APIError(400, 'ValidationError', message, details);
};

export const isValidationError = (
  e: unknown
): e is APIError & { type: 'ValidationError' } => {
  return isAPIError(e) && e.type === 'ValidationError';
};
