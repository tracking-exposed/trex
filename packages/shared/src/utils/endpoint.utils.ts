import { MinimalEndpointInstance, TypeOfEndpointInstance } from '../endpoints';
import * as R from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/function';
import * as S from 'fp-ts/lib/string';
import * as A from 'fp-ts/lib/Array';

export const getStaticPath = <E extends MinimalEndpointInstance>(
  e: E,
  Input: TypeOfEndpointInstance<E>['Input']
): string => {
  const params = pipe(
    Input?.Params ?? ({} as any),
    R.mapWithIndex((i) => `:${i}`)
  );
  const path = e.getPath(params);

  return `${e.Method} ${path}`;
};

const toArray = (
  rec: Record<string, MinimalEndpointInstance>
): MinimalEndpointInstance[] =>
  pipe(
    R.toArray(rec),
    A.map(([k, e]) => e)
  );

export const fromStaticPath =
  (endpoints: Array<Record<string, MinimalEndpointInstance>>) =>
  (staticPath?: string, Params?: any): MinimalEndpointInstance | undefined => {
    if (staticPath !== undefined) {
      return endpoints
        .flatMap(toArray)
        .find((e) => S.Eq.equals(getStaticPath(e, Params), staticPath));
    }
    return undefined;
  };
