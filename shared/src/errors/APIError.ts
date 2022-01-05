export const isAPIError = (e: unknown): e is APIError => {
  return (e as any).name === 'APIError';
};

export class APIError {
  public readonly name = 'APIError';

  constructor(
    public readonly type: string,
    public readonly message: string,
    public readonly details: string[]
  ) {}
}
