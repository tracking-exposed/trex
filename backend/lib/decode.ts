import { PathReporter } from "io-ts/lib/PathReporter";
import * as t from "io-ts";

type DecodeResult<A> =
  | {
      error: true;
      result: string[];
    }
  | {
      error: false;
      result: A;
    };

const decode = <A, O = A, I = unknown>(
  body: unknown,
  codec: t.Type<A, O, I>
): DecodeResult<A> => {
  const result = codec.decode(body as any);

  if (result._tag === "Left") {
    return {
      error: true,
      result: PathReporter.report(result),
    };
  }

  return {
    error: false,
    result: result.right,
  };
};

export { decode };
