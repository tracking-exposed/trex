import * as t from 'io-ts';

export const HTML = t.strict({

}, 'HTML_DB');

export type HTML = t.TypeOf<typeof HTML>