import {
  MinimalEndpointInstance,
  TypeOfEndpointInstance,
} from 'ts-endpoint/lib/helpers';
import * as R from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/function';
import * as Endpoints from '@backend/endpoints';
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

const allEndpoints = [
  Endpoints.v1.Public,
  Endpoints.v2.Public,
  Endpoints.v3.Public,
  Endpoints.v3.Creator,
].flatMap(toArray);

export const fromStaticPath = (
  staticPath?: string,
  Params?: any
): MinimalEndpointInstance | undefined => {
  if (staticPath !== undefined) {
    return allEndpoints.find((e) =>
      S.Eq.equals(getStaticPath(e, Params), staticPath)
    );
  }
  return undefined;
};
