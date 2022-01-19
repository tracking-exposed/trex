import { APIError } from './APIError';

export class AppError {
  constructor(
    public readonly name: string,
    public readonly message: string,
    public readonly details: string[]
  ) {}
}

export const toAppError = (e: unknown): AppError => {
  console.error('AppError', e);
  if (e instanceof APIError) {
    return e;
  }

  if (e instanceof Error) {
    return new AppError(e.name, e.message, []);
  }

  return new AppError(
    (e as any).name ?? `Unknown Error`,
    (e as any).message ?? 'Something bad happened',
    []
  );
};
