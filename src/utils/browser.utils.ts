import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';


const getBO = (): typeof chrome => {
  return pipe(
    window,
    O.fromPredicate((w) => typeof w !== 'undefined'),
    O.map((w) => w.chrome),
    O.getOrElse(() => window.browser)
  );
};

export const bo = getBO();
