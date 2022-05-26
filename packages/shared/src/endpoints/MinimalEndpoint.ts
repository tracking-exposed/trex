import { Endpoint, EndpointErrors, HTTPMethod } from 'ts-endpoint';
import { Codec, RecordCodec, runtimeType } from 'ts-io-error/Codec';
import { RequiredKeys } from 'typelevel-ts';
import { DocumentedEndpoint } from './DocumentedEndpoint';

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

export type MinimalEndpointInstance = MinimalEndpoint & {
  getStaticPath: (f: (i?: any) => string) => string;
};

export interface TypeOfEndpointInstance<E extends MinimalEndpointInstance> {
  getPath: E['getPath'];
  getStaticPath: E['getStaticPath'];
  Method: E['Method'];
  Output: runtimeType<E['Output']>;
  Errors: {
    [k in keyof NonNullable<E['Errors']>]: NonNullable<
      E['Errors']
    >[k] extends Codec<any, any, any>
      ? runtimeType<NonNullable<E['Errors']>[k]>
      : never;
  };
  Input: [RequiredKeys<E['Input']>] extends [never]
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    ? void
    : {
        [k in keyof NonNullable<E['Input']>]: NonNullable<
          E['Input']
        >[k] extends Codec<any, any, any>
          ? runtimeType<NonNullable<E['Input']>[k]>
          : never;
      };
}
