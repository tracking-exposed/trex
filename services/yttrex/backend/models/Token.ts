import * as t from 'io-ts';

export const Token = t.strict({

}, 'TokenDB');

export type Token = t.TypeOf<typeof Token>