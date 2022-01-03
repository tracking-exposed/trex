export const isAPIError = (e: unknown): e is APIError => {
  return (e as any).name === 'APIError';
};
export class APIError {
  name = 'APIError';
  message: string;
  details: string[];

  constructor(message: string, details: string[]) {
    this.message = message;
    this.details = details;
  }
}
