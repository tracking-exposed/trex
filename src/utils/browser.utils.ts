import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';

const getBO = (): typeof chrome => {
  return pipe(
    browser,
    O.fromNullable,
    O.getOrElse(() => chrome)
  );
};

export const bo = getBO();
