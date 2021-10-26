import { PathReporter } from "io-ts/lib/PathReporter";
import * as t from "io-ts";
import { MinimalEndpointInstance } from "ts-endpoint";
import * as E from "fp-ts/lib/Either";
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import { serializedType } from "ts-io-error/lib/Codec";

type DecodeRequestResult<E extends MinimalEndpointInstance> =
  | {
      type: "error";
      result: string[];
    }
  | {
      type: "success";
      result: {
        params: serializedType<E["Input"]["Params"]>;
        query: serializedType<E["Input"]["Query"]>;
        headers: serializedType<E["Input"]["Headers"]>;
        body: serializedType<E["Input"]["Body"]>;
      };
    };

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
        type: "error",
        result: PathReporter.report(E.left(e)),
      }),
      (result): DecodeRequestResult<E> => ({ type: "success", result })
    )
  );
};

type DecodeResponseResult<E extends MinimalEndpointInstance> =
  | {
      type: "error";
      result: string[];
    }
  | {
      type: "success";
      result: serializedType<E["Output"]>;
    };

const decodeResponse = <E extends MinimalEndpointInstance>(
  e: E,
  result: any
): DecodeResponseResult<E> => {
  return pipe(
    e.Output.decode(result),
    E.fold(
      (e): DecodeResponseResult<E> => ({
        type: "error",
        result: PathReporter.report(E.left(e)),
      }),
      (result): DecodeResponseResult<E> => ({ type: "success", result })
    )
  );
};

export { decodeRequest, decodeResponse };
