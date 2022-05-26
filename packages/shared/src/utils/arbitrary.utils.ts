import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';

/**
 *
 * Strip io-ts t.type codec props from a given array of keys
 *
 * * ```ts
 * const codec = t.type({ id: t.string, name: t.string });
 * const onlyIdCodec = propsOmitType(codec, ['name']);
 * // onlyIdCodec = { id: t.string }
 * ```
 *
 * @typeParam P - the codec props
 * @typeParam PP - the array of codec prop keys
 *
 * @param codec  A io-ts codec
 * @param props  A list of codec property key
 * @returns A new map of codecs for the remaining properties
 *
 */
export const propsOmitType = <P extends t.Props, PP extends Array<keyof P>>(
  codec: t.TypeC<P>,
  props: PP
): Omit<P, PP[number]> =>
  pipe(
    codec.props,
    R.filterMapWithIndex((k, p) =>
      pipe(
        p,
        O.fromPredicate(() => !props.includes(k))
      )
    ) as any
  );

/**
 * Strip io-ts t.strict codec props from a given array of keys
 *
 * ```ts
 * const codec = t.strict({ id: t.string, name: t.string });
 * const onlyIdCodec = propsOmit(codec, ['name']);
 * // onlyIdCodec = { id: t.string }
 * ```
 *
 * @typeParam P - the codec props
 * @typeParam PP - the array of codec prop keys
 *
 * @param codec A io-ts codec
 * @param props  A list of codec property key
 * @returns A new map of codecs for the remaining properties
 *
 */
export const propsOmit = <P extends t.Props, PP extends Array<keyof P>>(
  codec: t.ExactC<t.TypeC<P>>,
  props: PP
): Omit<P, PP[number]> => propsOmitType(codec.type, props);
