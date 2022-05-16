import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

/**
 * An utility method to transform TaskEither to Promise
 *
 */
export const foldTEOrThrow = <E, A>(te: TE.TaskEither<E, A>): Promise<A> => {
  return pipe(
    te,
    TE.fold(
      (e) => () => Promise.reject(e),
      (a) => () => Promise.resolve(a)
    )
  )();
};
