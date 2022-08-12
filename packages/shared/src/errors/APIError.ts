export const isAPIError = (e: unknown): e is APIError => {
  return (e as any).name === 'APIError';
};

export class APIError extends Error {
  public readonly name = 'APIError';

  constructor(
    public readonly status: number,
    public readonly type: string,
    public readonly message: string,
    public readonly details: string[]
  ) {
    super(message);
  }
}
