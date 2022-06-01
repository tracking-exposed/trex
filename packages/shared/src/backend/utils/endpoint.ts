import { failure } from 'io-ts/lib/PathReporter';
import {
  DocumentedEndpointInstance,
  MinimalEndpointInstance,
} from '../../endpoints';
import { GetEndpointSubscriber } from 'ts-endpoint-express';
import { RecordCodec, runtimeType } from 'ts-io-error/Codec';
import { IOError } from 'ts-io-error/lib';
import { Controller } from 'ts-endpoint-express/Controller';
import { Codec } from 'ts-io-error/lib/Codec';
import { Kind } from 'ts-endpoint-express/HKT';
import express from 'express';
import { EndpointInstance, InferEndpointParams } from 'ts-endpoint';

const toError = (e: unknown): IOError => {
  // console.log(e);
  if (Array.isArray(e) && e[0].context !== undefined) {
    return {
      name: 'Validation Error',
      status: 400,
      message: 'Error during validation',
      details: {
        kind: 'DecodingError',
        errors: failure(e),
      },
    };
  }

  return {
    name: 'EndpointError',
    status: 500,
    message: 'Unknown error',
    details: {
      kind: 'DecodingError',
      errors: [],
    },
  };
};

declare type UndefinedOrRuntime<N> = N extends RecordCodec<any, any>
  ? {
      [k in keyof N['props']]: runtimeType<N['props'][k]>;
    }
  : undefined;

export declare type InferEndpointInstanceParams<EI> =
  EI extends DocumentedEndpointInstance<infer E>
    ? InferEndpointParams<E>
    : EI extends EndpointInstance<infer E>
    ? InferEndpointParams<E>
    : never;

export const AddEndpoint = GetEndpointSubscriber(toError) as (
  router: express.Router,
  ...m: express.RequestHandler[]
) => <E extends MinimalEndpointInstance>(
  endpoint: E,
  controller: Controller<
    Kind<'IOError', NonNullable<E['Errors']>>,
    UndefinedOrRuntime<InferEndpointInstanceParams<E>['params']>,
    UndefinedOrRuntime<InferEndpointInstanceParams<E>['headers']>,
    UndefinedOrRuntime<InferEndpointInstanceParams<E>['query']>,
    InferEndpointInstanceParams<E>['body'] extends undefined
      ? undefined
      : InferEndpointInstanceParams<E>['body'] extends Codec<any, any, any>
      ? runtimeType<InferEndpointInstanceParams<E>['body']>
      : undefined,
    runtimeType<InferEndpointInstanceParams<E>['output']>
  >
) => void;
