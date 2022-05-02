import * as t from 'io-ts';

export const StringOrNull = t.union([t.string, t.null], 'StringOrNull');
export type StringOrNull = t.TypeOf<typeof StringOrNull>;
