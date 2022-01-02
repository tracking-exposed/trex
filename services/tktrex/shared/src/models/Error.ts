/**
 * WARNING about custom Error types:
 * the "instanceof" operator will only recognize
 * subclasses of Error in TypeScript-generated JS when
 * the transpilation target is >= es2015.
 */

export class URLError extends Error {
  constructor(message: string, public url: URL) {
    super(message);
  }
}
