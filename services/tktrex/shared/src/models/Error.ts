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

export class ParseError extends Error {
  public missingFields: string[] = [];

  addMissingField(field: string): ParseError {
    this.missingFields.push(field);

    return this;
  }
}
