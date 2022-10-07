import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

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
       return Promise.reject(e)
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
