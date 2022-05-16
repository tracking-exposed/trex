import * as t from 'io-ts';

export const Format = t.union([t.literal('csv'), t.literal('json')], 'Format');
export type Format = t.TypeOf<typeof Format>;
