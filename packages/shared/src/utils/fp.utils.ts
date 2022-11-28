import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import { AppError } from '../errors/AppError';

/**
 * An utility method to transform TaskEither to Promise
 *
 */
export const foldTEOrThrow = <E, A>(te: TE.TaskEither<E, A>): Promise<A> => {
  return pipe(
    te,
    TE.fold(
      (e) => () => {
        // eslint-disable-next-line
        console.error(e);
        return Promise.reject(e);
      },
      (a) => () => Promise.resolve(a)
    )
  )();
};

/**
 * Fold the either by throwing the error when `E.isLeft(e) === true`
 *
 * @param e the Either instance to fold
 * @returns If the either given has `_tag` equal to "Right" then the value is returned.
 * Throws the `either.left` error otherwise
 */
export const throwEitherError = <E, A>(e: E.Either<E, A>): A => {
  return pipe(
    e,
    E.fold(
      (err) => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw err;
      },
      (a) => a
    )
  );
};

/**
 * Filter an array by the given codec and return only valid elements
 *
 * @param arr
 * @param decode
 * @returns
 */
export const filterByCodec = <T, A>(
  arr: T[],
  decode: t.Decode<T, A>,
  reporter?: (e: t.ValidationError[], a: T) => void
): A[] => {
  return pipe(
    arr,
    A.map((a) =>
      pipe(
        decode(a),
        E.fold(
          (e) => {
            // call the reporter with the failed entry
            // and the occurred error
            if (reporter) {
              reporter(e, a);
            }
            return O.none;
          },
          (v) => O.some(v)
        )
      )
    ),
    A.compact
  );
};

export const validateArrayByCodec = <T, A>(
  arr: T[],
  mapFn: (o: T) => E.Either<AppError, A>
): A[] => {
  return pipe(
    // map each element of the array with the given fn to obtain the result
    arr.map(mapFn),
    // check all results are valid `Either` (Right)
    A.sequence(E.Applicative),
    // throw an error when `Eithen` is `Left`
    throwEitherError
  );
};
