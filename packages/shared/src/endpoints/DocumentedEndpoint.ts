import {
  Endpoint,
  EndpointErrors,
  EndpointInstance,
  HTTPMethod,
} from 'ts-endpoint';
import { RecordCodec, Codec } from 'ts-io-error/lib/Codec';

export interface DocsOpts {
  title: string;
  description: string | { path: string };
  tags: string[];
}

export type DocumentedEndpoint<
  M extends HTTPMethod,
  O extends Codec<any, any, any>,
  H extends RecordCodec<any, any> | undefined = undefined,
  Q extends RecordCodec<any, any> | undefined = undefined,
  B extends Codec<any, any, any> | undefined = undefined,
  P extends RecordCodec<any, any> | undefined = undefined,
  E extends EndpointErrors<never, Codec<any, any, any>> | undefined = undefined
> = Endpoint<M, O, H, Q, B, P, E> & DocsOpts;

export type MinimalEndpoint =
  | (Omit<
      Endpoint<
        HTTPMethod,
        Codec<any, any, any>,
        RecordCodec<any, any>,
        RecordCodec<any, any>,
        Codec<any, any, any>,
        RecordCodec<any, any>,
        EndpointErrors<never, Codec<any, any, any>>
      >,
      'getPath'
    > & {
      getPath: (i?: any) => string;
    })
  | (Omit<
      DocumentedEndpoint<
        HTTPMethod,
        Codec<any, any, any>,
        RecordCodec<any, any>,
        RecordCodec<any, any>,
        Codec<any, any, any>,
        RecordCodec<any, any>,
        EndpointErrors<never, Codec<any, any, any>>
      >,
      'getPath'
    > & {
      getPath: (i?: any) => string;
    });

// export declare function Endpoint<M extends HTTPMethod, O extends Codec<any, any, any>, H extends RecordCodec<any, any> | undefined = undefined, Q extends RecordCodec<any, any> | undefined = undefined, B extends Codec<any, any, any> | undefined = undefined, P extends RecordCodec<any, any> | undefined = undefined, E extends EndpointErrors<never, Codec<any, any, any>> | undefined = undefined>(e: Endpoint<M, O, H, Q, B, P, E>): EndpointInstance<Endpoint<M, O, H, Q, B, P, E>>;
export type DocumentedEndpointInstance<E extends MinimalEndpoint> =
  EndpointInstance<E> & DocsOpts;

export const DocumentedEndpoint = <
  M extends HTTPMethod,
  O extends Codec<any, any, any>,
  H extends RecordCodec<any, any> | undefined = undefined,
  Q extends RecordCodec<any, any> | undefined = undefined,
  B extends Codec<any, any, any> | undefined = undefined,
  P extends RecordCodec<any, any> | undefined = undefined,
  E extends EndpointErrors<never, Codec<any, any, any>> | undefined = undefined
>({
  title,
  description,
  tags,
  ...opts
}: DocumentedEndpoint<M, O, H, Q, B, P, E>): DocumentedEndpointInstance<
  DocumentedEndpoint<M, O, H, Q, B, P, E>
> => {
  const endpoint = Endpoint(opts);
  return {
    ...endpoint,
    title,
    description,
    tags,
  };
};