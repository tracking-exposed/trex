import * as Endpoints from '@trex/shared/endpoints';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import * as S from 'fp-ts/lib/string';
import {
  MinimalEndpointInstance,
  TypeOfEndpointInstance
} from 'ts-endpoint/lib/helpers';

export const getStaticPath = <E extends MinimalEndpointInstance>(
  e: E,
  Input: TypeOfEndpointInstance<E>['Input']
): string => {
  const params = pipe(
    (Input as any)?.Params ?? ({} as any),
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

export const fromStaticPath = <M extends MinimalEndpointInstance>(
  staticPath?: string,
  Params?: any
): M | undefined => {
  if (staticPath !== undefined) {
    return allEndpoints.find((e) =>
      S.Eq.equals(getStaticPath(e, Params), staticPath)
    ) as M;
  }
  return undefined;
};
