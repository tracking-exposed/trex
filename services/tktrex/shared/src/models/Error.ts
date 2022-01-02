export class URLError extends Error {
  constructor(message: string, public url: URL) {
    super(message);
  }
}
