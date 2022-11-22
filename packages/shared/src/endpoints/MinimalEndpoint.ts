import { Codec, runtimeType } from 'ts-io-error/Codec';
import { RequiredKeys } from 'typelevel-ts';
import { MinimalEndpoint } from './DocumentedEndpoint';

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
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : {
        [K in keyof NonNullable<E['Input']>]: NonNullable<
          E['Input']
        >[K] extends Codec<any, any, any>
          ? runtimeType<NonNullable<E['Input']>[K]>
          : never;
      };
}
