import * as TE from 'fp-ts/lib/TaskEither';

export const throwTE = async <E, A>(te: TE.TaskEither<E, A>): Promise<A> => {
  return await te().then((rr) => {
    if (rr._tag === 'Left') {
      return Promise.reject(rr.left);
    }
    return Promise.resolve(rr.right);
  });
};
