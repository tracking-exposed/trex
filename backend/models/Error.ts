import * as t from 'io-ts';

export const Error = t.strict({

}, 'ErrorDB');

export type Error = t.TypeOf<typeof Error>