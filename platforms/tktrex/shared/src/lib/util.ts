import {
  Either, map, mapLeft,
} from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

/**
 * Normalize a string,
 * - removing leading and trailing white space,
 * - replacing all internal white space with a single space,
 * - decoding URL encoded characters,
 * - and converting null and undefined to the empty string.
 */
export const normalizeString = (x: unknown): string =>
  (typeof x === 'string' ? decodeURI(x.trim().replace(/\s+/g, ' ')) : '');

type Normalizable =
  number | string | undefined | null | boolean |
  Normalizable[] | { [key: string]: Normalizable };

/**
 * Normalize an object recursively,
 * @see normalizeString
 */
export const normalizeDeepStrings = (x: Normalizable): Normalizable => {
  if (typeof x === 'string') {
    return normalizeString(x);
  }

  if (Array.isArray(x)) {
    return x.map(normalizeDeepStrings);
  }

  if (x && typeof x === 'object') {
    const entries = Object.entries(x);
    const result: Normalizable = {};
    entries.forEach(([key, value]) => {
      result[key] = normalizeDeepStrings(value);
    });
    return result;
  }

  return x;
};



export const hasKey = <T extends object>(key: string) =>
  (x: T): x is T & { [key: string]: unknown } =>
    x && typeof x === 'object' &&
      Object.hasOwnProperty.call(x, key);

/**
 * Throw an error if the "received" value is not
 * included deeply in the "expected" value.
 *
 * Used in tests.
 */
export const expectToBeIncludedIn = <T>(expected: unknown) =>
  (received: T): T => {
    if (typeof received !== 'object' || !received) {
      throw new Error(`expected ${received} to be an object`);
    }

    if (typeof expected !== 'object' || !expected) {
      throw new Error(`expected ${expected} to be an object`);
    }

    // restrict expected to the keys of received
    const newExpected = Object.entries(received)
      .reduce((
        acc: { [key: string]: unknown },
        [key, value],
      ) => {
        if (!hasKey(key)(expected)) {
          throw new Error(`received unexpected key "${key}"`);
        }

        return ({
          ...acc,
          [key]: expected[key],
        });
      }, {});

    expect(received).toEqual(newExpected);
    return received;
  };

/**
 * Accepts a function taking a normal value and
 * returns a function taking an Either that will throw an error
 * if its argument is not a Right and otherwise call the initial
 * function on the unpacked Right value.
 *
 * Used in tests.
 */
export const expectToBeEitherRight = <E, A, B>(assertFn: (a: A) => B) =>
  (received: Either<E, A>): Either<unknown, B> => {
    return pipe(received, map(assertFn), mapLeft((e) => {
      if (e instanceof Error) {
        throw e;
      } else {
        throw new Error('expected received object to be a Right');
      }
    }));
  };

/**
 * Accepts an optional function that takes a Left value and returns
 * a function taking an Either that will throw an error if its argument
 * is not a Left and otherwise call the initial function (if provided)
 * on the unpacked Left value.
 *
 * The provided optional function may be used to assert the type
 * of the Left obtained.
 *
 * Used in tests.
 */
export const expectToBeEitherLeft = <E, A>(assertFn?: (e: E) => void) =>
  (received: Either<E, A>): Either<unknown, A> =>
    pipe(
      received,
      map(() => {
        throw new Error('expected received object to be a Left');
      }),
      mapLeft((e) => {
        if (assertFn) {
          assertFn(e);
        }
      }),
    );
