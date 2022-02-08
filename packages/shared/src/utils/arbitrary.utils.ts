import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';

export const propsOmit = <P extends t.Props, PP extends Array<keyof P>>(
  codec: t.ExactC<t.TypeC<P>>,
  props: PP
): Omit<P, PP[number]> =>
  pipe(
    codec.type.props,
    R.filterMapWithIndex((k, p) =>
      pipe(
        p,
        O.fromPredicate(() => !props.includes(k))
      )
    ) as any
  );
