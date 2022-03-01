import * as t from 'io-ts';

export const Email = t.strict({

}, 'EmailDB');

export type Email = t.TypeOf<typeof Email>