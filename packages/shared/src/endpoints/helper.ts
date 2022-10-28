import { sequenceS } from 'fp-ts/lib/Apply';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import {
  InferEndpointInstanceParams,
  UndefinedOrRuntime,
} from '../backend/utils/endpoint';
import { serializedType } from 'ts-io-error/lib/Codec';
import { MinimalEndpointInstance } from './MinimalEndpoint';
import { APIError } from '../errors/APIError';

interface DecodeError {
  type: 'error';
  result: string[];
}

interface DecodeRequestSuccess<E extends MinimalEndpointInstance> {
  type: 'success';
  result: {
    params: UndefinedOrRuntime<InferEndpointInstanceParams<E>['params']>;
    query: UndefinedOrRuntime<InferEndpointInstanceParams<E>['query']>;
    headers: UndefinedOrRuntime<InferEndpointInstanceParams<E>['query']>;
    body: UndefinedOrRuntime<InferEndpointInstanceParams<E>['body']>;
  };
}

type DecodeRequestResult<E extends MinimalEndpointInstance> =
  | DecodeError
  | DecodeRequestSuccess<E>;

const decodeRequest = <E extends MinimalEndpointInstance>(
  e: E,
  req: any
): DecodeRequestResult<E> => {
  return pipe(
    sequenceS(E.Applicative)({
      headers: pipe(req.headers, (e.Input?.Headers ?? t.unknown).decode),
      query: pipe(req.query, (e.Input?.Query ?? t.unknown).decode),
      params: pipe(req.params, (e.Input?.Params ?? t.unknown).decode),
      body: pipe(req.body, (e.Input?.Body ?? t.unknown).decode),
    }),
    E.fold(
      (e): DecodeRequestResult<E> => ({
        type: 'error',
        result: PathReporter.report(E.left(e)),
      }),
      (result): DecodeRequestResult<E> => ({ type: 'success', result })
    )
  );
};

interface DecodeResponseSuccess<E extends MinimalEndpointInstance> {
  type: 'success';
  result: serializedType<E['Output']>;
}

type DecodeResponseResult<E extends MinimalEndpointInstance> =
  | DecodeError
  | DecodeResponseSuccess<E>;

const decodeResponse = <E extends MinimalEndpointInstance>(
  e: E,
  result: any
): DecodeResponseResult<E> => {
  return pipe(
    e.Output.decode(result),
    E.fold(
      (e): DecodeResponseResult<E> => ({
        type: 'error',
        result: PathReporter.report(E.left(e)),
      }),
      (result): DecodeResponseResult<E> => ({ type: 'success', result })
    )
  );
};

const decodeOrThrowRequest = <E extends MinimalEndpointInstance>(
  e: E,
  r: unknown
): DecodeRequestSuccess<E>['result'] => {
  return pipe(decodeRequest(e, r), (r) => {
    if (r.type === 'error') {
      throw new APIError('Bad Request', {
        kind: 'DecodingError',
        errors: r.result,
      });
    }

    return r.result;
  });
};

export { decodeRequest, decodeResponse, decodeOrThrowRequest };
