import { APIError } from 'providers/api.provider';

export class AppError extends Error {
  name: string;
  details: string[];
  constructor(name: string, message: string, details: string[]) {
    super(message);
    this.name = name;
    this.details = details;
  }
}

export const toAppError = (e: unknown): AppError => {
  if (e instanceof APIError) {
    return e;
  }

  if (e instanceof Error) {
    return new AppError(e.name, e.message, []);
  }

  return new AppError(`Unknown Error`, 'Something bad happened', []);
};
