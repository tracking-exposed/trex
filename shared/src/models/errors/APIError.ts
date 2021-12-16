export class APIError extends Error {
  name: string;
  details: string[];
  constructor(name: string, message: string, details: string[]) {
    super(message);
    this.name = name;
    this.details = details;
  }
}
