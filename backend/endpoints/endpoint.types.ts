import { MinimalEndpoint } from "ts-endpoint";

export interface ResourceEndpoints<
  G extends MinimalEndpoint,
  L extends MinimalEndpoint,
  C extends MinimalEndpoint,
  E extends MinimalEndpoint,
  D extends MinimalEndpoint
> {
  Get: G;
  List: L;
  Create: C;
  Edit: E;
  Delete: D;
}

export const ResourceEndpoints = <
  G extends MinimalEndpoint,
  L extends MinimalEndpoint,
  C extends MinimalEndpoint,
  E extends MinimalEndpoint,
  D extends MinimalEndpoint
>(endpoints: {
  Get: G;
  List: L;
  Create: C;
  Edit: E;
  Delete: D;
}): ResourceEndpoints<G, L, C, E, D> => endpoints;
