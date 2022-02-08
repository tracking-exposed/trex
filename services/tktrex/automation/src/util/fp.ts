import { Either, isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { Type } from 'io-ts';

export const decodeOrThrow =
  <A, O, I>(codec: Type<A, O, I>) =>
    (input: I): A => {
      const result = codec.decode(input);
      if (isLeft(result)) {
        throw new Error(PathReporter.report(result).join('\n'));
      }
      return result.right;
    };

export const rightOrThrow = <A>(either: Either<Error, A>): A => {
  if (isLeft(either)) {
    throw either.left;
  }
  return either.right;
};

export const hasProperty =
  <K extends PropertyKey, O>(property: K) =>
    (object: O): object is O & Record<K, unknown> =>
      object && typeof object === 'object' && property in object;
